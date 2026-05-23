import {
  arrayField,
  createForm,
  field,
  type FormPatch,
} from '../../src/index.js';

type Values = {
  email: string;
  password: string;
  profile: {
    firstName: string;
    age: number;
  };
  members: Array<{
    id: string;
    name: string;
    active: boolean;
  }>;
};

const defaultValues: Values = {
  email: '',
  password: '',
  profile: {
    firstName: '',
    age: 0,
  },
  members: [{ id: '1', name: '', active: false }],
};

const form = createForm({
  defaultValues,
  fields: {
    email: field<string, Values>({
      validators: {
        onChange: ({ value, values }) => {
          value.toUpperCase();
          values.password.toUpperCase();

          return undefined;
        },
        onChangeListenTo: ['password'],
      },
    }),
    'profile.age': field<number, Values>({
      validators: {
        onChange: ({ value, values }) => {
          value.toFixed();
          values.profile.firstName.toUpperCase();

          return undefined;
        },
      },
    }),
  },
  arrays: {
    members: arrayField<Values['members'][number]>({
      getItemId: (item) => item.id,
    }),
  },
});

form.controls.email.setValue('user@example.com');
form.controls['profile.age'].setValue(42);
form.arrays.members.push({ id: '2', name: 'Ada', active: true });
form.arrays.members.items[0]?.controls.name.setValue('Grace');
form.reset({
  email: '',
  password: '',
  profile: {
    firstName: '',
    age: 1,
  },
  members: [],
});
form.applyServerErrors({
  email: 'Invalid',
  'profile.age': 'Required',
  'members[0].name': 'Required',
});
form.onPatch((patches) => {
  const patch: FormPatch | undefined = patches[0];
  void patch;
});

const rawValue: Values = form.getRawValue();
const emailValue: string = form.controls.email.value;
const ageValue: number = form.controls['profile.age'].value;
const memberValue: Values['members'][number] | undefined =
  form.arrays.members.items[0]?.value;
void rawValue;
void emailValue;
void ageValue;
void memberValue;

createForm({
  defaultValues: {
    email: '',
  },
  fields: {
    // @ts-expect-error unknown field paths must be rejected
    missing: field(),
  },
});

createForm({
  defaultValues: {
    members: [{ id: '1', name: '' }],
  },
  fields: {},
  arrays: {
    // @ts-expect-error unknown array paths must be rejected
    missing: arrayField({ getItemId: (item) => item.id }),
  },
});

createForm({
  defaultValues: {
    email: '',
    count: 0,
  },
  fields: {
    // @ts-expect-error field config value type must match defaultValues path
    count: field<string>(),
  },
});

createForm({
  defaultValues: {
    email: '',
    password: '',
  },
  fields: {
    email: field<string, { email: string; password: string }>({
      validators: {
        // @ts-expect-error linked field paths must exist
        onChangeListenTo: ['missing'],
      },
    }),
  },
});

// @ts-expect-error control setValue must preserve field value type
form.controls.email.setValue(123);
// @ts-expect-error nested control setValue must preserve nested value type
form.controls['profile.age'].setValue('42');
// @ts-expect-error arrays must preserve item shape
form.arrays.members.push({ id: '3', title: 'Ada' });
// @ts-expect-error array item controls must preserve item field value type
form.arrays.members.items[0]?.controls.active.setValue('yes');
// @ts-expect-error reset must preserve form value shape
form.reset({ email: '' });
form.applyServerErrors({
  // @ts-expect-error server error paths must exist
  missing: 'Invalid',
});
