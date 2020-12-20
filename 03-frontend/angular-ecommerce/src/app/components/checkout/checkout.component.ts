import {Component, OnInit} from '@angular/core';
import {AbstractControl, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {Luv2ShopFormService} from '../../services/luv2-shop-form.service';
import {Country} from '../../common/country';
import {State} from '../../common/state';
import {Luv2ShopValidators} from '../../validators/luv2-shop-validators';
import {CartService} from '../../services/cart.service';
import {CheckoutService} from '../../services/checkout.service';
import {Router} from '@angular/router';
import {Order} from '../../common/order';
import {OrderItem} from '../../common/order-item';
import {Purchase} from '../../common/purchase';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {

  checkoutFormGroup: FormGroup;

  totalPrice = 0;
  totalQuantity = 0;

  creditCardYears: number[] = [];
  creditCardMonths: number[] = [];

  countries: Country[] = [];

  shippingAddressStates: State[] = [];
  billingAddressStates: State[] = [];

  constructor(private formBuilder: FormBuilder,
              private luv2ShopFormService: Luv2ShopFormService,
              private cartService: CartService,
              private checkoutService: CheckoutService,
              private router: Router) {
  }

  ngOnInit(): void {

    this.reviewCartDetails();

    this.checkoutFormGroup = this.formBuilder.group({
      customer: this.formBuilder.group({
        firstName: new FormControl('',
          [Validators.required,
            Luv2ShopValidators.enoughChars]),
        lastName: new FormControl('',
          [Validators.required,
            Luv2ShopValidators.enoughChars]),
        email: new FormControl('',
          [Validators.required,
            Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$')])
      }),
      shippingAddress: this.formBuilder.group({
        street: new FormControl('',
          [Validators.required,
            Luv2ShopValidators.enoughChars]),
        city: new FormControl('',
          [Validators.required,
            Luv2ShopValidators.enoughChars]),
        state: new FormControl('',
          [Validators.required]),
        country: new FormControl('',
          [Validators.required]),
        zipCode: new FormControl('',
          [Validators.required,
            Luv2ShopValidators.enoughChars])
      }),
      billingAddress: this.formBuilder.group({
        street: new FormControl('',
          [Validators.required,
            Luv2ShopValidators.enoughChars]),
        city: new FormControl('',
          [Validators.required,
            Luv2ShopValidators.enoughChars]),
        state: new FormControl('',
          [Validators.required]),
        country: new FormControl('',
          [Validators.required]),
        zipCode: new FormControl('',
          [Validators.required,
            Luv2ShopValidators.enoughChars])
      }),
      creditCard: this.formBuilder.group({
        cardType: new FormControl('',
          [Validators.required]),
        nameOnCard: new FormControl('',
          [Validators.required,
            Luv2ShopValidators.enoughChars]),
        cardNumber: new FormControl('',
          [Validators.required,
            Validators.pattern('[0-9]{16}')]),
        securityCode: new FormControl('',
          [Validators.required,
            Validators.pattern('[0-9]{3}')]),
        expirationMonth: [''],
        expirationYear: ['']
      }),
    });

    // populate the credit card months
    const startMonth = new Date().getMonth() + 1;
    console.log('startMonth: ' + startMonth);

    this.luv2ShopFormService.getCreditCardMonths(startMonth).subscribe(
      data => {
        console.log('Retrieved credit card months: ' + JSON.stringify(data));
        this.creditCardMonths = data;
      }
    );

    // populate the credit card years
    this.luv2ShopFormService.getCreditCardYears().subscribe(
      data => {
        console.log('Retrieved credit card years: ' + JSON.stringify(data));
        this.creditCardYears = data;
      }
    );

    // populate countries
    this.luv2ShopFormService.getCountries().subscribe(
      data => {
        console.log('Retrieved countries: ' + JSON.stringify(data));
        this.countries = data;
      }
    );
  }

  get firstName(): AbstractControl {
    return this.checkoutFormGroup.get('customer.firstName');
  }

  get lastName(): AbstractControl {
    return this.checkoutFormGroup.get('customer.lastName');
  }

  get email(): AbstractControl {
    return this.checkoutFormGroup.get('customer.email');
  }

  get shippingAddressStreet(): AbstractControl {
    return this.checkoutFormGroup.get('shippingAddress.street');
  }

  get shippingAddressCity(): AbstractControl {
    return this.checkoutFormGroup.get('shippingAddress.city');
  }

  get shippingAddressState(): AbstractControl {
    return this.checkoutFormGroup.get('shippingAddress.state');
  }

  get shippingAddressCountry(): AbstractControl {
    return this.checkoutFormGroup.get('shippingAddress.country');
  }

  get shippingAddressZipCode(): AbstractControl {
    return this.checkoutFormGroup.get('shippingAddress.zipCode');
  }

  get billingAddressStreet(): AbstractControl {
    return this.checkoutFormGroup.get('billingAddress.street');
  }

  get billingAddressCity(): AbstractControl {
    return this.checkoutFormGroup.get('billingAddress.city');
  }

  get billingAddressState(): AbstractControl {
    return this.checkoutFormGroup.get('billingAddress.state');
  }

  get billingAddressCountry(): AbstractControl {
    return this.checkoutFormGroup.get('billingAddress.country');
  }

  get billingAddressZipCode(): AbstractControl {
    return this.checkoutFormGroup.get('billingAddress.zipCode');
  }

  get creditCardType(): AbstractControl {
    return this.checkoutFormGroup.get('creditCard.cardType');
  }

  get creditCardNameOnCard(): AbstractControl {
    return this.checkoutFormGroup.get('creditCard.nameOnCard');
  }

  get creditCardNumber(): AbstractControl {
    return this.checkoutFormGroup.get('creditCard.cardNumber');
  }

  get creditCardSecurityCode(): AbstractControl {
    return this.checkoutFormGroup.get('creditCard.securityCode');
  }

  copyShippingAddressToBillingAddress(event): void {

    if (event.target.checked) {
      this.checkoutFormGroup.controls.billingAddress.setValue(this.checkoutFormGroup.controls.shippingAddress.value);

      // bug fix for states
      this.billingAddressStates = this.shippingAddressStates;

    } else {
      this.checkoutFormGroup.controls.billingAddress.reset();
      this.billingAddressStates = [];
    }
  }

  onSubmit(): void {
    console.log('Handling the submit button');

    if (this.checkoutFormGroup.invalid) {
      this.checkoutFormGroup.markAllAsTouched();
      return;
    }

    // set up order
    let order = new Order();
    order.totalPrice = this.totalPrice;
    order.totalQuantity = this.totalQuantity;

    // get cart items
    const cartItems = this.cartService.cartItems;

    // create orderItems from cartItems
    let orderItems: OrderItem[] = cartItems.map(tempCartItem => new OrderItem(tempCartItem));

    // set up purchase
    let purchase = new Purchase();

    // set up purchase - customer
    purchase.customer = this.checkoutFormGroup.controls['customer'].value;

    // populate purchase - shipping address
    purchase.shippingAddress = this.checkoutFormGroup.controls['shippingAddress'].value;
    const shippingState: State = JSON.parse(JSON.stringify(purchase.shippingAddress.state));
    const shippingCountry: Country = JSON.parse(JSON.stringify(purchase.shippingAddress.country));
    purchase.shippingAddress.state = shippingState.name;
    purchase.shippingAddress.country = shippingCountry.name;

    // populate purchase - billing address
    purchase.billingAddress = this.checkoutFormGroup.controls['billingAddress'].value;
    const billingState: State = JSON.parse(JSON.stringify(purchase.billingAddress.state));
    const billingCountry: Country = JSON.parse(JSON.stringify(purchase.billingAddress.country));
    purchase.billingAddress.state = billingState.name;
    purchase.billingAddress.country = billingCountry.name;

    // populate purchase - order and orderItems
    purchase.order = order;
    purchase.orderItems = orderItems;

    // call REST API via the CheckoutService
    this.checkoutService.placeOrder(purchase).subscribe({
      next: response => {
        alert(`Your order has been received.\nOrder tracking number: ${response.orderTrackingNumber}`);

        // reset cart
        this.resetCart();
      },
      error: error => {
        alert(`There was an error: ${error.message}`);
      }
    });

  }

  handleMonthsAndYears(): void {
    const creditCardFormGroup = this.checkoutFormGroup.get('creditCard');

    const currentYear = new Date().getFullYear();
    const selectedYear = Number(creditCardFormGroup.value.expirationYear);

    // if the current year equals the selected year, then start with the current month
    let startMonth: number;

    if (currentYear === selectedYear) {
      startMonth = new Date().getMonth() + 1;
    } else {
      startMonth = 1;
    }

    this.luv2ShopFormService.getCreditCardMonths(startMonth).subscribe(
      data => {
        console.log('Retrieved credit card months: ' + JSON.stringify(data));
        this.creditCardMonths = data;
      }
    );
  }

  getStates(formGroupName: string): void {

    const formGroup = this.checkoutFormGroup.get(formGroupName);

    const countryCode = formGroup.value.country.code;
    const countryName = formGroup.value.country.name;

    console.log(`${formGroupName} countryCode: ${countryCode}`);
    console.log(`${formGroupName} countryName: ${countryName}`);

    this.luv2ShopFormService.getStates(countryCode).subscribe(
      data => {
        if (formGroupName === 'shippingAddress') {
          this.shippingAddressStates = data;
        } else {
          this.billingAddressStates = data;
        }
        // select first item by default
        formGroup.get('state').setValue(data[0]);
      }
    );
  }

  private reviewCartDetails(): void {

    // subscribe to cartService.totalQuantity
    this.cartService.totalQuantity.subscribe(
      totalQuantity => this.totalQuantity = totalQuantity
    );

    // subscribe to cartService.totalPrice
    this.cartService.totalPrice.subscribe(
      totalPrice => this.totalPrice = totalPrice
    );
  }

  private resetCart(): void {
    // reset cart data
    this.cartService.cartItems = [];
    this.cartService.totalPrice.next(0);
    this.cartService.totalQuantity.next(0);

    // reset the form data
    this.checkoutFormGroup.reset();

    // navigate back to the products page
    this.router.navigateByUrl('/products');
  }
}
