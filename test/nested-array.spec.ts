import { reaction } from 'mobx';

import { arrayField, createForm, field } from '../src/index.js';

describe('nested paths and arrays', () => {
  it('supports nested object field paths as MobX-reactive controls', () => {
    const form = createForm({
      defaultValues: {
        profile: {
          name: '',
        },
      },
      fields: {
        'profile.name': field<string>(),
      },
    });
    const observedValues: string[] = [];
    const disposeReaction = reaction(
      () => form.controls['profile.name'].value,
      (value) => {
        observedValues.push(value);
      },
    );

    form.controls['profile.name'].setValue('Ada');

    expect(form.controls['profile.name'].value).toBe('Ada');
    expect(form.getRawValue()).toEqual({
      profile: {
        name: 'Ada',
      },
    });
    expect(observedValues).toEqual(['Ada']);

    disposeReaction();
    form.dispose();
  });

  it('applies server errors to nested object field paths', () => {
    const form = createForm({
      defaultValues: {
        profile: {
          name: '',
        },
      },
      fields: {
        'profile.name': field<string>(),
      },
    });

    form.applyServerErrors({
      'profile.name': 'Required',
    });

    expect(form.controls['profile.name'].error).toBe('Required');
    expect(form.controls['profile.name'].visibleError).toBe('Required');

    form.controls['profile.name'].setValue('Ada');

    expect(form.controls['profile.name'].error).toBeUndefined();
    expect(form.controls['profile.name'].visibleError).toBeUndefined();

    form.dispose();
  });

  it('keeps array item ids stable across array operations', () => {
    const form = createMembersForm();

    expect(readMemberIds(form)).toEqual(['1', '2']);

    form.arrays.members.push({ id: '3', name: 'Cara' });
    expect(readMemberIds(form)).toEqual(['1', '2', '3']);

    form.arrays.members.insert(1, { id: '4', name: 'Dina' });
    expect(readMemberIds(form)).toEqual(['1', '4', '2', '3']);

    form.arrays.members.removeById('4');
    expect(readMemberIds(form)).toEqual(['1', '2', '3']);

    form.arrays.members.move(2, 0);
    expect(readMemberIds(form)).toEqual(['3', '1', '2']);

    form.arrays.members.swap(0, 2);
    expect(readMemberIds(form)).toEqual(['2', '1', '3']);

    form.arrays.members.removeAt(1);
    expect(readMemberIds(form)).toEqual(['2', '3']);

    form.arrays.members.clear();
    expect(readMemberIds(form)).toEqual([]);

    form.dispose();
  });

  it('exposes array item values and controls at current indexes', () => {
    const form = createMembersForm();
    const firstMember = form.arrays.members.items[0];

    expect(firstMember?.id).toBe('1');
    expect(firstMember?.index).toBe(0);
    expect(firstMember?.value).toEqual({ id: '1', name: 'Ann' });

    firstMember?.controls.name.setValue('Annie');

    expect(form.getRawValue().members[0]?.name).toBe('Annie');
    expect(form.arrays.members.items[0]?.value).toEqual({
      id: '1',
      name: 'Annie',
    });

    form.dispose();
  });

  it('remaps array item server errors by stable item id after index changes', () => {
    const form = createMembersForm();

    expect(form.arrays.members.items).toHaveLength(2);
    form.applyServerErrors({
      'members[1].name': 'Required',
    });

    expect(form.arrays.members.items[1]?.controls.name.error).toBe('Required');

    form.arrays.members.move(1, 0);

    expect(form.arrays.members.items[0]?.id).toBe('2');
    expect(form.arrays.members.items[0]?.controls.name.error).toBe('Required');

    form.arrays.members.swap(0, 1);

    expect(form.arrays.members.items[1]?.id).toBe('2');
    expect(form.arrays.members.items[1]?.controls.name.error).toBe('Required');

    form.arrays.members.removeById('1');

    expect(form.arrays.members.items[0]?.id).toBe('2');
    expect(form.arrays.members.items[0]?.controls.name.error).toBe('Required');

    form.arrays.members.items[0]?.controls.name.setValue('Bobby');

    expect(form.arrays.members.items[0]?.controls.name.error).toBeUndefined();

    form.dispose();
  });

  it('rejects duplicate array item ids because public identity must be stable', () => {
    const form = createForm({
      defaultValues: {
        members: [
          { id: 'same', name: 'Ann' },
          { id: 'same', name: 'Bob' },
        ],
      },
      fields: {},
      arrays: {
        members: arrayField<MemberValues['members'][number]>({
          getItemId: (item) => item.id,
        }),
      },
    });

    expect(() => form.arrays.members.items).toThrow(
      'Array field "members" has duplicate item id "same".',
    );

    form.dispose();
  });

  it('rejects new array items with duplicate stable ids', () => {
    const form = createMembersForm();

    expect(() => {
      form.arrays.members.push({ id: '2', name: 'Bobby' });
    }).toThrow('Array field "members" has duplicate item id "2".');
    expect(readMemberIds(form)).toEqual(['1', '2']);

    form.dispose();
  });

  it('supports nested array paths', () => {
    const form = createForm({
      defaultValues: {
        groups: [
          {
            id: 'group-1',
            members: [{ id: '1', name: 'Ann' }],
          },
        ],
      },
      fields: {},
      arrays: {
        'groups[0].members': arrayField<{ id: string; name: string }>({
          getItemId: (item) => item.id,
        }),
      },
    });

    expect(form.arrays['groups[0].members'].items[0]?.id).toBe('1');

    form.arrays['groups[0].members'].push({ id: '2', name: 'Bob' });

    expect(form.getRawValue().groups[0]?.members).toEqual([
      { id: '1', name: 'Ann' },
      { id: '2', name: 'Bob' },
    ]);

    form.dispose();
  });
});

type MemberValues = {
  members: Array<{
    id: string;
    name: string;
  }>;
};

function createMembersForm() {
  return createForm({
    defaultValues: {
      members: [
        { id: '1', name: 'Ann' },
        { id: '2', name: 'Bob' },
      ],
    },
    fields: {},
    arrays: {
      members: arrayField<MemberValues['members'][number]>({
        getItemId: (item) => item.id,
      }),
    },
  });
}

function readMemberIds(form: ReturnType<typeof createMembersForm>): string[] {
  return form.arrays.members.items.map((item) => item.id);
}
