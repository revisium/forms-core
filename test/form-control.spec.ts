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

  it('runs debounced async validation through TanStack form-core', async () => {
    const validatedValues: string[] = [];
    const form = createForm({
      defaultValues: {
        email: '',
      },
      fields: {
        email: field<string>({
          validators: {
            onChangeAsyncDebounceMs: 20,
            onChangeAsync: async ({ value, signal }) => {
              validatedValues.push(value);
              await delay(5);

              if (signal.aborted) {
                return undefined;
              }

              return value === 'taken@example.com'
                ? 'Email is already taken'
                : undefined;
            },
          },
        }),
      },
    });

    form.controls.email.setValue('first@example.com');
    form.controls.email.setValue('taken@example.com');

    await delay(80);

    expect(validatedValues).toEqual(['taken@example.com']);
    expect(form.controls.email.error).toBe('Email is already taken');
    expect(form.controls.email.visibleError).toBe('Email is already taken');
    expect(form.controls.email.isValidating).toBe(false);
    expect(form.isValid).toBe(false);

    form.dispose();
  });

  it('runs blur validators through TanStack form-core', async () => {
    const form = createForm({
      defaultValues: {
        email: '',
      },
      fields: {
        email: field<string>({
          validators: {
            onBlur: ({ value }) =>
              value === 'sync-blur' ? 'Blur sync invalid' : undefined,
            onBlurAsyncDebounceMs: 20,
            onBlurAsync: async ({ value, signal }) => {
              await delay(5);

              if (signal.aborted) {
                return undefined;
              }

              return value === 'async-blur' ? 'Blur async invalid' : undefined;
            },
          },
        }),
      },
    });

    form.controls.email.setValue('sync-blur');
    form.controls.email.blur();

    expect(form.controls.email.error).toBe('Blur sync invalid');

    form.controls.email.setValue('async-blur');
    form.controls.email.blur();
    await delay(80);

    expect(form.controls.email.error).toBe('Blur async invalid');

    form.dispose();
  });

  it('revalidates linked fields when a dependency changes', () => {
    type PasswordValues = {
      password: string;
      confirm: string;
    };

    const form = createForm({
      defaultValues: {
        password: 'secret',
        confirm: 'secret',
      },
      fields: {
        password: field<string, PasswordValues>(),
        confirm: field<string, PasswordValues>({
          validators: {
            onChangeListenTo: ['password'],
            onBlurListenTo: ['password'],
            onChange: ({ value, values }) =>
              value === values.password ? undefined : 'Passwords do not match',
          },
        }),
      },
    });

    form.controls.password.setValue('changed');

    expect(form.controls.confirm.error).toBe('Passwords do not match');
    expect(form.isValid).toBe(false);

    form.controls.confirm.setValue('changed');

    expect(form.controls.confirm.error).toBeUndefined();
    expect(form.isValid).toBe(true);

    form.dispose();
  });

  it('applies form-level validation to form and field errors', async () => {
    const form = createForm({
      defaultValues: {
        email: '',
        password: '',
      },
      fields: {
        email: field<string>(),
        password: field<string>(),
      },
      validators: {
        onSubmit: ({ value }) => ({
          form: 'Complete the credentials',
          fields: value.email.includes('@') ? {} : { email: 'Invalid email' },
        }),
      },
    });

    await form.validate();

    expect(form.isValid).toBe(false);
    expect(form.errors).toContain('Complete the credentials');
    expect(form.controls.email.error).toBe('Invalid email');
    expect(form.controls.email.visibleError).toBe('Invalid email');

    form.controls.email.setValue('user@example.com');
    await form.validate();

    expect(form.controls.email.error).toBeUndefined();

    form.dispose();
  });

  it('treats empty form-level error bags as success', async () => {
    const form = createForm({
      defaultValues: {
        email: 'valid@example.com',
      },
      fields: {
        email: field<string>(),
      },
      validators: {
        onSubmit: () => ({
          fields: {},
        }),
      },
    });

    await form.validate();

    expect(form.isValid).toBe(true);
    expect(form.errors).toEqual([]);
    expect(form.controls.email.error).toBeUndefined();

    form.dispose();
  });

  it('adapts form change, blur, and async validators', async () => {
    const form = createForm({
      defaultValues: {
        email: 'initial@example.com',
      },
      fields: {
        email: field<string>(),
      },
      validators: {
        onChange: () => null,
        onChangeAsyncDebounceMs: 20,
        onChangeAsync: async ({ value, signal }) => {
          await delay(5);

          if (signal.aborted) {
            return undefined;
          }

          return value.email === 'async-form'
            ? 'Async form invalid'
            : undefined;
        },
        onBlur: ({ value }) => ({
          fields: value.email.includes('@') ? {} : { email: 'Blur form field' },
        }),
        onBlurAsyncDebounceMs: 20,
        onBlurAsync: async ({ value }) =>
          value.email === 'blur-form'
            ? { form: 'Async blur form', fields: {} }
            : undefined,
      },
    });

    form.controls.email.setValue('async-form');
    await delay(80);

    expect(form.errors).toContain('Async form invalid');

    form.controls.email.setValue('invalid-email');
    form.controls.email.blur();

    expect(form.controls.email.error).toBe('Blur form field');

    form.controls.email.setValue('blur-form');
    form.controls.email.blur();
    await delay(80);

    expect(form.errors).toContain('Async blur form');

    form.dispose();
  });

  it('applies form-level async submit validation to field errors', async () => {
    const form = createForm({
      defaultValues: {
        email: 'submit-async@example.com',
      },
      fields: {
        email: field<string>(),
      },
      validators: {
        onSubmitAsync: async ({ value }) =>
          value.email === 'submit-async@example.com'
            ? { fields: { email: 'Submit async form field' } }
            : undefined,
      },
    });

    await form.validate();

    expect(form.controls.email.error).toBe('Submit async form field');

    form.dispose();
  });

  it('exposes submit validation through validate() and submit()', async () => {
    const form = createForm({
      defaultValues: {
        email: '',
        password: '',
      },
      fields: {
        email: field<string>({
          validators: {
            onSubmit: ({ value }) =>
              value.length > 0 ? undefined : 'Required',
          },
        }),
        password: field<string>({
          validators: {
            onSubmitAsync: async ({ value }) =>
              value.length > 0 ? undefined : 'Password required',
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
    expect(form.controls.password.error).toBe('Password required');
    expect(form.controls.email.visibleError).toBe('Required');
    expect(observedVisibleErrors).toEqual(['Required']);

    await form.submit();

    expect(form.controls.email.visibleError).toBe('Required');

    disposeReaction();
    form.dispose();
  });

  it('keeps server errors explicit until value changes or reset', async () => {
    const form = createEmailForm();

    form.applyServerErrors({
      email: 'Email already exists',
    });

    expect(form.isValid).toBe(false);
    expect(form.controls.email.error).toBe('Email already exists');
    expect(form.controls.email.visibleError).toBe('Email already exists');

    await form.validate();

    expect(form.controls.email.error).toBe('Email already exists');
    expect(form.controls.email.visibleError).toBe('Email already exists');

    form.controls.email.setValue('next@example.com');

    expect(form.controls.email.error).toBeUndefined();
    expect(form.controls.email.visibleError).toBeUndefined();

    form.applyServerErrors({
      email: 'Email already exists',
    });
    form.reset();

    expect(form.controls.email.value).toBe('valid@example.com');
    expect(form.controls.email.error).toBeUndefined();
    expect(form.controls.email.visibleError).toBeUndefined();
    expect(form.isDirty).toBe(false);
    expect(form.isTouched).toBe(false);

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

async function delay(milliseconds: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
