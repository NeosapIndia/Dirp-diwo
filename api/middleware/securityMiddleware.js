const express = require('express');
const sanitizeHtml = require('sanitize-html');

const exceptions = ['create new drip', 'delete from group'];

/**
 * Centralized SQL Injection Patterns
 */

const sqlInjectionPatterns = [
	// Detects SQL commands followed by specific SQL entities
	/\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|EXEC|UNION)\s+(\*|FROM|INTO|TABLE|DATABASE|SCHEMA|VIEW|VALUES)\b/i,

	// SQL Logical Operators (OR/AND 1=1, etc.)
	/\b(OR|AND)\s+[\'\"]?\d+[\'\"]?\s*[=<>]\s*[\'\"]?\d+[\'\"]?/i,

	// Comments that attackers use to hide malicious queries
	/;[\s\r\n]--[\s\r\n]$/,
	/--[\s\r\n]+/,
	/\/\*[\s\S]*?\*\//,
	/#[\s\r\n]*$/,

	// SQL Execution commands
	/\bEXEC\b\s+(\bxp_\b|\bsp_\b)/i,

	// Sleep() and Waitfor Delay Attacks
	/\bSLEEP\s*\(\s*\d+\s*\)/i,
	/\bWAITFOR\b\s+\bDELAY\b/i,

	// File manipulation via SQL
	/\bLOAD_FILE\s*\(/i,
	/\bINTO\b\s+\bOUTFILE\b/i,

	// Detect common SQL patterns
	/\bSELECT\b.+\bFROM\b/i,
	/\bINSERT\b.+\bINTO\b/i,
	/\bUPDATE\b.+\bSET\b/i,
	/\bDELETE\b.+\bFROM\b/i,
];

/**
 * Field Type Mapping
 * Define the expected type for each field (e.g., 'html', 'string', etc.)
 */
const fieldTypeMapping = {
	htmlField: 'html', // Fields expected to contain HTML
	description: 'html', // Another HTML field
	customTemplate: 'html',
	name: 'string', // Plain string fields
	email: 'string', // Plain string fields
};

/**
 * Function to sanitize and validate HTML input.
 */
function sanitizeAndValidateHtml(value) {
	try {
		// console.log('Sanitizing HTML:', value); // Debug log
		// Define allowed tags and attributes
		const cleanHtml = sanitizeHtml(value, {
			allowedTags: [
				'b',
				'i',
				'em',
				'strong',
				'a',
				'p',
				'ul',
				'ol',
				'li',
				'br',
				'span',
				'div',
				'img',
				'h1',
				'h2',
				'h3',
				'h4',
				'h5',
				'h6',
			],
			allowedAttributes: {
				a: ['href', 'target'], // Allow href and target for <a> tags
				img: ['src', 'alt', 'width', 'height'],
				'*': ['style', 'class'], // Allow style and class for all tags
			},
			allowedSchemes: ['http', 'https', 'mailto'], // Allow only safe URL schemes
		});

		// Check if the sanitized HTML is empty (indicating malicious input)
		if (!cleanHtml.trim() || cleanHtml.includes('<script')) {
			throw new Error('Invalid HTML input detected');
		}

		return cleanHtml; // Return sanitized HTML
	} catch (error) {
		console.error('Error in sanitizeAndValidateHtml:', error);
		return null; // Return null if sanitization fails
	}
}

/**
 * Function to check if input contains harmful SQL injection patterns or unsafe HTML.
 * Returns an object with `isUnsafe` and `reason`.
 */
function containsDangerousChars(value, fieldName = '') {
	try {
		const fieldType = fieldTypeMapping[fieldName] || 'string'; // Default to 'string' if no mapping exists
		// console.log(`Field: ${fieldName}, Type: ${fieldType}`); // Debug log

		// Recursive check for arrays
		if (Array.isArray(value)) {
			for (const item of value) {
				const result = containsDangerousChars(item, fieldName);
				if (result.isUnsafe) return result;
			}
		}

		// Recursive check for objects
		if (typeof value === 'object' && value !== null) {
			for (const [key, item] of Object.entries(value)) {
				const result = containsDangerousChars(item, key);
				if (result.isUnsafe) return result;
			}
		}

		// Check for HTML input
		if (fieldType === 'html' && typeof value === 'string' && value !== '' && value !== null) {
			// Sanitize and validate HTML
			const sanitizedHtml = sanitizeAndValidateHtml(value);
			if (!sanitizedHtml) {
				// console.log('Blocked unsafe HTML input');
				return { isUnsafe: true, reason: 'Unsafe HTML detected' };
			}
			return { isUnsafe: false }; // HTML is safe
		}

		// Check for string input
		if (typeof value === 'string') {
			const lower = value.toLowerCase().trim();

			// ?? Context-aware SQL Injection Detection
			for (const pattern of sqlInjectionPatterns) {
				if (pattern.test(lower)) {
					let temp = lower;
					for (let exception of exceptions) {
						temp = temp.replaceAll(exception.toLowerCase(), '');
					}
					if (!pattern.test(temp)) {
						continue;
					}

					// console.log('Blocked SQL Injection Pattern:', pattern);

					console.log('------SQL injection error---lower---', lower);
					return { isUnsafe: true, reason: 'SQL injection pattern detected' };
				}
			}

			// ?? Block dangerous symbols
			const forbiddenSymbols = ['|', '$', 'randomblob'];
			for (const symbol of forbiddenSymbols) {
				if (lower.includes(symbol)) {
					console.log('Blocked Symbol:', symbol);
					return { isUnsafe: true, reason: 'Forbidden symbol detected' };
				}
			}

			// Extra check for extremely suspicious combinations
			if (/['"][=<>]['"]/.test(lower) || /'\s*OR\s*'/.test(lower)) {
				// console.log('Blocked suspicious combination');
				return { isUnsafe: true, reason: 'Suspicious combination detected' };
			}
		}

		return { isUnsafe: false }; // Input is safe
	} catch (error) {
		console.error('Error in containsDangerousChars:', error);
		return { isUnsafe: true, reason: 'Error during validation' }; // Assume unsafe if error occurs
	}
}

/**
 * Middleware to scan and reject requests containing harmful special characters or unsafe HTML.
 */
async function securityMiddleware(req, res, next) {
	try {
		// Check all input fields (query params, body, and URL params)
		for (const [key, value] of Object.entries(req.query)) {
			const result = containsDangerousChars(value, key);
			if (result.isUnsafe) {
				return res.status(400).json({ error: result.reason });
			}
		}

		for (const [key, value] of Object.entries(req.params)) {
			const result = containsDangerousChars(value, key);
			if (result.isUnsafe) {
				return res.status(400).json({ error: result.reason });
			}
		}

		for (const [key, value] of Object.entries(req.body)) {
			const result = containsDangerousChars(value, key);
			if (result.isUnsafe) {
				return res.status(400).json({ error: result.reason });
			}
		}

		next(); // Proceed if no harmful characters are found
	} catch (error) {
		console.error('Security Middleware Error:', error);
		return res.status(500).json({ error: 'Server error while validating input' });
	}
}

module.exports = securityMiddleware;
