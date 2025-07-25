import { AbstractControl } from '@angular/forms';

export function passwordValidator(control: AbstractControl) {

  if (control && control.value !== null && control.value !== undefined) {
    const value = control.value as string;
    if (value.length < 8) {
      return {
        invalidPassword: true,
        message: 'Password must be at least 8 characters long',
      };
    }

    if (!/\d/.test(value)) {
      return {
        invalidPassword: true,
        message: 'The password must have a number',
      };
    }

    if (!/[a-z]/.test(value)) {
      return {
        invalidPassword: true,
        message: 'The password must have lowercase characters',
      };
    }

    if (!/[A-Z]/.test(value)) {
      return {
        invalidPassword: true,
        message: 'The password must have upercase characters',
      };
    }

    if (!/\W/.test(value)) {
      return {
        invalidPassword: true,
        message: 'The password must have special characters',
      };
    }
  }
  return null;
}
