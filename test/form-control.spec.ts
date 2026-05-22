import { reaction } from 'mobx';

import { createForm, field } from '../src/index.js';

describe('createForm scalar controls', () => {
  it('updates MobX reactions when a control value changes', () => {
    const form = createForm({
      defaultValues: {
        email: '',
      },
      fields: {
        email: field<string>(),
      },
    });
    const observedValues: string[] = [];
    const disposeReaction = reaction(
      () => form.controls.email.value,
      (value) => {
        observedValues.push(value);
      },
    );

    form.controls.email.setValue('user@example.com');

    expect(form.controls.email.value).toBe('user@example.com');
    expect(form.controls.email.displayValue).toBe('user@example.com');
    expect(observedValues).toEqual(['user@example.com']);

    disposeReaction();
    form.dispose();
  });

  it('updates MobX reactions when validation changes form validity', () => {
    const form = createEmailForm();
    const observedValidity: boolean[] = [];
    const disposeReaction = reaction(
      () => form.isValid,
      (isValid) => {
        observedValidity.push(isValid);
      },
    );

    form.controls.email.setValue('invalid');
    form.controls.email.setValue('valid@example.com');

    expect(form.controls.email.error).toBeUndefined();
    expect(form.controls.email.visibleError).toBeUndefined();
    expect(observedValidity).toEqual([false, true]);

    disposeReaction();
    form.dispose();
  });

  it('does not require consumers to subscribe to TanStack stores', () => {
    const form = createForm({
      defaultValues: {
        email: '',
      },
      fields: {
        email: field<string>(),
      },
    });
    const observedValues: string[] = [];
    const disposeReaction = reaction(
      () => form.controls.email.value,
      (value) => {
        observedValues.push(value);
      },
    );

    expect('subscribe' in form).toBe(false);
    expect('subscribe' in form.controls.email).toBe(false);

    form.controls.email.setValue('without-manual-subscribe@example.com');

    expect(observedValues).toEqual(['without-manual-subscribe@example.com']);

    disposeReaction();
    form.dispose();
  });

  it('tracks dirty and touched state from TanStack field metadata', () => {
    const form = createForm({
      defaultValues: {
        email: '',
      },
      fields: {
        email: field<string>(),
      },
    });

    expect(form.isDirty).toBe(false);
    expect(form.isTouched).toBe(false);
    expect(form.controls.email.isDirty).toBe(false);
    expect(form.controls.email.isTouched).toBe(false);

    form.controls.email.blur();

    expect(form.isTouched).toBe(true);
    expect(form.controls.email.isTouched).toBe(true);

    form.controls.email.setValue('changed@example.com');

    expect(form.isDirty).toBe(true);
    expect(form.controls.email.isDirty).toBe(true);

    form.dispose();
  });

  it('restores values and dirty/touched state on form reset', () => {
    const form = createForm({
      defaultValues: {
        email: '',
        password: '',
      },
      fields: {
        email: field<string>(),
        password: field<string>(),
      },
    });

    form.controls.email.setValue('changed@example.com');
    form.controls.password.blur();

    expect(form.getRawValue()).toEqual({
      email: 'changed@example.com',
      password: '',
    });
    expect(form.isDirty).toBe(true);
    expect(form.isTouched).toBe(true);
    expect(form.isSubmitting).toBe(false);
    expect(form.errors).toEqual([]);

    form.reset({
      email: 'reset@example.com',
      password: 'new-default',
    });

    expect(form.getRawValue()).toEqual({
      email: 'reset@example.com',
      password: 'new-default',
    });
    expect(form.controls.email.value).toBe('reset@example.com');
    expect(form.controls.password.value).toBe('new-default');
    expect(form.isDirty).toBe(false);
    expect(form.isTouched).toBe(false);
    expect(form.controls.email.isDirty).toBe(false);
    expect(form.controls.password.isTouched).toBe(false);

    form.controls.email.setValue('changed-again@example.com');
    form.reset();

    expect(form.controls.email.value).toBe('reset@example.com');
    expect(form.isDirty).toBe(false);

    form.dispose();
  });

  it('resets a single control to its default value and metadata', () => {
    const form = createForm({
      defaultValues: {
        email: '',
        password: '',
      },
      fields: {
        email: field<string>(),
        password: field<string>(),
      },
    });

    form.controls.email.setValue('changed@example.com');
    form.controls.password.setValue('keep@example.com');
    form.controls.email.reset();

    expect(form.controls.email.value).toBe('');
    expect(form.controls.email.isDirty).toBe(false);
    expect(form.controls.email.isTouched).toBe(false);
    expect(form.controls.password.value).toBe('keep@example.com');
    expect(form.controls.password.isDirty).toBe(true);

    form.dispose();
  });

  it('normalizes field errors and exposes visible errors after touch', () => {
    const form = createEmailForm();

    form.controls.email.setValue('invalid');

    expect(form.isValid).toBe(false);
    expect(form.controls.email.error).toBe('Invalid email');
    expect(form.controls.email.visibleError).toBe('Invalid email');
    expect(form.controls.email.isValidating).toBe(false);

    form.dispose();
  });

  it('exposes submit validation through validate() and submit()', async () => {
    const form = createForm({
      defaultValues: {
        email: '',
      },
      fields: {
        email: field<string>({
          validators: {
            onSubmit: ({ value }) =>
              value.length > 0 ? undefined : 'Required',
          },
        }),
      },
    });
    const observedVisibleErrors: Array<string | undefined> = [];
    const disposeReaction = reaction(
      () => form.controls.email.visibleError,
      (visibleError) => {
        observedVisibleErrors.push(visibleError);
      },
    );

    await form.validate();

    expect(form.isValid).toBe(false);
    expect(form.controls.email.error).toBe('Required');
    expect(form.controls.email.visibleError).toBe('Required');
    expect(observedVisibleErrors).toEqual(['Required']);

    await form.submit();

    expect(form.controls.email.visibleError).toBe('Required');

    disposeReaction();
    form.dispose();
  });

  it('keeps bridge subscriptions disposed after form disposal', () => {
    const form = createForm({
      defaultValues: {
        email: '',
      },
      fields: {
        email: field<string>(),
      },
    });
    const observedValues: string[] = [];
    const disposeReaction = reaction(
      () => form.controls.email.value,
      (value) => {
        observedValues.push(value);
      },
    );

    form.dispose();
    form.dispose();
    form.controls.email.setValue('late@example.com');

    expect(observedValues).toEqual([]);

    disposeReaction();
  });
});

function createEmailForm() {
  return createForm({
    defaultValues: {
      email: 'valid@example.com',
    },
    fields: {
      email: field<string>({
        validators: {
          onChange: ({ value }) =>
            value.includes('@') ? undefined : 'Invalid email',
        },
      }),
    },
  });
}
