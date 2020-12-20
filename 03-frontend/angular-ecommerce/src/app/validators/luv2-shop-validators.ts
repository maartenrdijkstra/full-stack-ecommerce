import {FormControl, ValidationErrors} from '@angular/forms';

export class Luv2ShopValidators {

  // whitespace validation
  static enoughChars(control: FormControl): ValidationErrors {

    // check if string only contains whitespace
    if ((control.value != null) && (control.value.length > 0) && (control.value.trim().length < 2)) {

      // invalid, return object
      return {enoughChars: true};
    } else {
      // valid, return null
      return null;
    }

  }
}
