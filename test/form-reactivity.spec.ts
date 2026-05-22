import { computed, reaction } from 'mobx';

import { arrayField, createForm, field } from '../src/index.js';

describe('MobX public reactivity contract', () => {
  it('updates only the changed scalar control reaction', () => {
    const form = createCredentialsForm();
    const emailValues: string[] = [];
    const passwordValues: string[] = [];
    const disposeEmail = reaction(
      () => form.controls.email.value,
      (value) => {
        emailValues.push(value);
      },
    );
    const disposePassword = reaction(
      () => form.controls.password.value,
      (value) => {
        passwordValues.push(value);
      },
    );

    form.controls.email.setValue('user@example.com');

    expect(emailValues).toEqual(['user@example.com']);
    expect(passwordValues).toEqual([]);

    form.controls.password.setValue('secret');

    expect(emailValues).toEqual(['user@example.com']);
    expect(passwordValues).toEqual(['secret']);

    disposeEmail();
    disposePassword();
    form.dispose();
  });

  it('keeps computed consumers reactive without manual subscriptions', () => {
    const form = createCredentialsForm();
    const emailSummary = computed(() =>
      form.controls.email.value === ''
        ? 'empty'
        : `email:${form.controls.email.value}`,
    );
    const summaries: string[] = [];
    const dispose = reaction(
      () => emailSummary.get(),
      (summary) => {
        summaries.push(summary);
      },
    );

    form.controls.password.setValue('does-not-matter');
    form.controls.email.setValue('ada@example.com');

    expect(summaries).toEqual(['email:ada@example.com']);

    dispose();
    form.dispose();
  });

  it('does not re-run aggregate form reactions when the selected value is unchanged', () => {
    const form = createCredentialsForm();
    const dirtyValues: boolean[] = [];
    const dispose = reaction(
      () => form.isDirty,
      (isDirty) => {
        dirtyValues.push(isDirty);
      },
    );

    form.controls.email.setValue('user@example.com');
    form.controls.password.setValue('secret');

    expect(dirtyValues).toEqual([true]);

    dispose();
    form.dispose();
  });

  it('isolates nested path reactions from sibling nested fields', () => {
    const form = createForm({
      defaultValues: {
        profile: {
          firstName: '',
          lastName: '',
        },
      },
      fields: {
        'profile.firstName': field<string>(),
        'profile.lastName': field<string>(),
      },
    });
    const firstNames: string[] = [];
    const lastNames: string[] = [];
    const disposeFirstName = reaction(
      () => form.controls['profile.firstName'].value,
      (value) => {
        firstNames.push(value);
      },
    );
    const disposeLastName = reaction(
      () => form.controls['profile.lastName'].value,
      (value) => {
        lastNames.push(value);
      },
    );

    form.controls['profile.firstName'].setValue('Ada');

    expect(firstNames).toEqual(['Ada']);
    expect(lastNames).toEqual([]);

    form.controls['profile.lastName'].setValue('Lovelace');

    expect(firstNames).toEqual(['Ada']);
    expect(lastNames).toEqual(['Lovelace']);

    disposeFirstName();
    disposeLastName();
    form.dispose();
  });

  it('updates array item id reactions for array structure changes only', () => {
    const form = createMembersForm();
    void form.arrays.members.items;
    const idSnapshots: string[][] = [];
    const arrayValueSnapshots: MemberValues['members'][] = [];
    const titleValues: string[] = [];
    const disposeIds = reaction(
      () => form.arrays.members.items.map((item) => item.id),
      (ids) => {
        idSnapshots.push(ids);
      },
    );
    const disposeArrayValue = reaction(
      () => form.arrays.members.value,
      (value) => {
        arrayValueSnapshots.push([...value]);
      },
    );
    const disposeTitle = reaction(
      () => form.controls.title.value,
      (title) => {
        titleValues.push(title);
      },
    );

    form.controls.title.setValue('Core Team');

    expect(titleValues).toEqual(['Core Team']);
    expect(idSnapshots).toEqual([]);

    form.arrays.members.items[0]?.controls.name.setValue('Annie');

    expect(idSnapshots).toEqual([]);
    expect(arrayValueSnapshots).toEqual([
      [
        { id: '1', name: 'Annie' },
        { id: '2', name: 'Bob' },
      ],
    ]);

    form.arrays.members.move(1, 0);
    expect(idSnapshots).toEqual([['2', '1']]);

    idSnapshots.splice(0, idSnapshots.length);
    form.arrays.members.push({ id: '3', name: 'Cara' });

    expect(idSnapshots).toEqual([['2', '1', '3']]);

    disposeIds();
    disposeArrayValue();
    disposeTitle();
    form.dispose();
  });

  it('keeps held array item controls bound to the stable item id after reorder', () => {
    const form = createMembersForm();
    const bob = getMemberItem(form, 1);
    const bobNames: string[] = [];
    const annNames: Array<string | undefined> = [];
    const disposeBob = reaction(
      () => bob.controls.name.value,
      (value) => {
        bobNames.push(value);
      },
    );
    const bobIndexes: number[] = [];
    const disposeBobIndex = reaction(
      () => bob.index,
      (index) => {
        bobIndexes.push(index);
      },
    );
    const disposeAnn = reaction(
      () =>
        form.arrays.members.items.find((item) => item.id === '1')?.controls.name
          .value,
      (value) => {
        annNames.push(value);
      },
    );

    form.arrays.members.move(1, 0);
    bob.controls.name.setValue('Bobby');
    bob.controls.name.blur();

    expect(bob.id).toBe('2');
    expect(bob.index).toBe(0);
    expect(bob.value).toEqual({ id: '2', name: 'Bobby' });
    expect(bob.controls.name.displayValue).toBe('Bobby');
    expect(bob.controls.name.error).toBeUndefined();
    expect(bob.controls.name.visibleError).toBeUndefined();
    expect(bob.controls.name.isDirty).toBe(true);
    expect(bob.controls.name.isTouched).toBe(true);
    expect(bob.controls.name.isValidating).toBe(false);
    expect(bobIndexes).toEqual([0]);

    expect(form.getRawValue().members).toEqual([
      { id: '2', name: 'Bobby' },
      { id: '1', name: 'Ann' },
    ]);
    expect(bobNames).toEqual(['Bobby']);
    expect(annNames).toEqual([]);

    disposeBob();
    disposeBobIndex();
    disposeAnn();
    form.dispose();
  });

  it('disposes held array item controls after their item is removed', () => {
    const form = createMembersForm();
    const bob = getMemberItem(form, 1);
    const bobNames: string[] = [];
    const disposeBob = reaction(
      () => bob.controls.name.value,
      (value) => {
        bobNames.push(value);
      },
    );

    form.arrays.members.removeById('2');
    bob.controls.name.setValue('Removed Bobby');
    bob.controls.name.blur();
    bob.controls.name.reset();

    expect(form.getRawValue().members).toEqual([{ id: '1', name: 'Ann' }]);
    expect(bob.value).toEqual({ id: '2', name: 'Bob' });
    expect(bobNames).toEqual([]);

    disposeBob();
    form.dispose();
  });

  it('supports primitive array items without item controls', () => {
    const form = createForm({
      defaultValues: {
        tags: ['core'],
      },
      fields: {},
      arrays: {
        tags: arrayField<string>({
          getItemId: (item) => item,
        }),
      },
    });

    expect(form.arrays.tags.items).toEqual([
      {
        id: 'core',
        index: 0,
        value: 'core',
        controls: {},
      },
    ]);

    form.dispose();
  });

  it('keeps array value signatures lossless for special JS values', () => {
    const form = createForm({
      defaultValues: {
        records: [
          { id: '1', value: undefined as unknown },
          { id: '2', value: null as unknown },
          { id: '3', value: 1n as unknown },
        ],
      },
      fields: {},
      arrays: {
        records: arrayField<{ id: string; value: unknown }>({
          getItemId: (item) => item.id,
        }),
      },
    });
    const snapshots: Array<readonly { id: string; value: unknown }[]> = [];
    const dispose = reaction(
      () => form.arrays.records.value,
      (value) => {
        snapshots.push([...value]);
      },
    );

    form.arrays.records.items[0]?.controls.value.setValue(Number.NaN);
    form.arrays.records.items[1]?.controls.value.setValue(undefined);
    form.arrays.records.items[2]?.controls.value.setValue(-0);

    expect(snapshots).toEqual([
      [
        { id: '1', value: Number.NaN },
        { id: '2', value: null },
        { id: '3', value: 1n },
      ],
      [
        { id: '1', value: Number.NaN },
        { id: '2', value: undefined },
        { id: '3', value: 1n },
      ],
      [
        { id: '1', value: Number.NaN },
        { id: '2', value: undefined },
        { id: '3', value: -0 },
      ],
    ]);

    dispose();
    form.dispose();
  });
});

type CredentialsValues = {
  email: string;
  password: string;
};

type MemberValues = {
  title: string;
  members: Array<{
    id: string;
    name: string;
  }>;
};

function createCredentialsForm() {
  return createForm({
    defaultValues: {
      email: '',
      password: '',
    },
    fields: {
      email: field<string, CredentialsValues>(),
      password: field<string, CredentialsValues>(),
    },
  });
}

function createMembersForm() {
  return createForm({
    defaultValues: {
      title: 'Team',
      members: [
        { id: '1', name: 'Ann' },
        { id: '2', name: 'Bob' },
      ],
    },
    fields: {
      title: field<string, MemberValues>(),
    },
    arrays: {
      members: arrayField<MemberValues['members'][number]>({
        getItemId: (item) => item.id,
      }),
    },
  });
}

function getMemberItem(
  form: ReturnType<typeof createMembersForm>,
  index: number,
) {
  const item = form.arrays.members.items[index];

  if (item === undefined) {
    throw new Error(`Expected member item at index ${index}.`);
  }

  return item;
}
