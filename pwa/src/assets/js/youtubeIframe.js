var scriptUrl = 'assets/js/widgetapi.js';
window['yt_embedsEnableIframeApiSendFullEmbedUrl'] = true;
window['yt_embedsEnableAutoplayAndVisibilitySignals'] = true;
try {
	var ttPolicy = window.trustedTypes.createPolicy('youtube-widget-api', {
		createScriptURL: function (x) {
			return x;
		},
	});
	scriptUrl = ttPolicy.createScriptURL(scriptUrl);
} catch (e) {}
var YT;
if (!window['YT']) YT = { loading: 0, loaded: 0 };
var YTConfig;
if (!window['YTConfig']) YTConfig = { host: 'https://www.youtube.com' };
if (!YT.loading) {
	YT.loading = 1;
	(function () {
		var l = [];
		YT.ready = function (f) {
			if (YT.loaded) f();
			else l.push(f);
		};
		window.onYTReady = function () {
			YT.loaded = 1;
			var i = 0;
			for (; i < l.length; i++)
				try {
					l[i]();
				} catch (e) {}
		};
		YT.setConfig = function (c) {
			var k;
			for (k in c) if (c.hasOwnProperty(k)) YTConfig[k] = c[k];
		};
		var a = document.createElement('script');
		a.type = 'text/javascript';
		a.id = 'www-widgetapi-script';
		a.src = scriptUrl;
		a.async = true;
		var c = document.currentScript;
		if (c) {
			var n = c.nonce || c.getAttribute('nonce');
			if (n) a.setAttribute('nonce', n);
		}
		var b = document.getElementsByTagName('script')[0];
		b.parentNode.insertBefore(a, b);
	})();
}
