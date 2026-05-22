import { arrayField, createForm, field, type FormPatch } from '../src/index.js';

describe('form patches', () => {
  it('emits scalar set patches', () => {
    const form = createForm({
      defaultValues: {
        email: '',
      },
      fields: {
        email: field<string>(),
      },
    });
    const emitted = collectPatches(form);

    form.controls.email.setValue('user@example.com');

    expect(emitted.batches).toEqual([
      [
        {
          type: 'set',
          path: 'email',
          value: 'user@example.com',
          previousValue: '',
        },
      ],
    ]);

    emitted.dispose();
    form.dispose();
  });

  it('emits nested object patches with full paths', () => {
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
    const emitted = collectPatches(form);

    form.controls['profile.name'].setValue('Ada');

    expect(emitted.batches).toEqual([
      [
        {
          type: 'set',
          path: 'profile.name',
          value: 'Ada',
          previousValue: '',
        },
      ],
    ]);

    emitted.dispose();
    form.dispose();
  });

  it('emits stable array operation patches', () => {
    const form = createMembersForm();
    const emitted = collectPatches(form);

    form.arrays.members.push({ id: '3', name: 'Cara' });
    expect(emitted.take()).toEqual([
      {
        type: 'insert',
        path: 'members',
        index: 2,
        value: { id: '3', name: 'Cara' },
      },
    ]);

    form.arrays.members.insert(1, { id: '4', name: 'Dina' });
    expect(emitted.take()).toEqual([
      {
        type: 'insert',
        path: 'members',
        index: 1,
        value: { id: '4', name: 'Dina' },
      },
    ]);

    form.arrays.members.removeById('1');
    expect(emitted.take()).toEqual([
      {
        type: 'remove',
        path: 'members[0]',
        previousValue: { id: '1', name: 'Ann' },
      },
    ]);

    form.arrays.members.move(2, 0);
    expect(emitted.take()).toEqual([
      {
        type: 'move',
        path: 'members',
        fromIndex: 2,
        toIndex: 0,
      },
    ]);

    form.arrays.members.swap(0, 2);
    expect(emitted.take()).toEqual([
      {
        type: 'set',
        path: 'members',
        value: [
          { id: '2', name: 'Bob' },
          { id: '4', name: 'Dina' },
          { id: '3', name: 'Cara' },
        ],
        previousValue: [
          { id: '3', name: 'Cara' },
          { id: '4', name: 'Dina' },
          { id: '2', name: 'Bob' },
        ],
      },
    ]);

    form.arrays.members.clear();
    expect(emitted.take()).toEqual([
      {
        type: 'clear',
        path: 'members',
        previousValue: [
          { id: '2', name: 'Bob' },
          { id: '4', name: 'Dina' },
          { id: '3', name: 'Cara' },
        ],
      },
    ]);

    emitted.dispose();
    form.dispose();
  });

  it('emits array item field patches at the current index', () => {
    const form = createMembersForm();
    const emitted = collectPatches(form);

    form.arrays.members.items[1]?.controls.name.setValue('Bobby');

    expect(emitted.batches).toEqual([
      [
        {
          type: 'set',
          path: 'members[1].name',
          value: 'Bobby',
          previousValue: 'Bob',
        },
      ],
    ]);

    emitted.dispose();
    form.dispose();
  });

  it('stops emitting after listener disposal', () => {
    const form = createMembersForm();
    const emitted = collectPatches(form);

    emitted.dispose();
    form.arrays.members.push({ id: '3', name: 'Cara' });

    expect(emitted.batches).toEqual([]);

    form.dispose();
  });

  it('disposes patch listeners and treats commands as no-ops after form disposal', () => {
    const form = createMembersForm();
    const emitted = collectPatches(form);

    form.dispose();
    form.arrays.members.push({ id: '3', name: 'Cara' });
    form.controls.title.setValue('After dispose');
    form.reset({
      title: 'Reset',
      members: [],
    });

    expect(emitted.batches).toEqual([]);
    expect(form.getRawValue()).toEqual({
      title: 'Team',
      members: [
        { id: '1', name: 'Ann' },
        { id: '2', name: 'Bob' },
      ],
    });

    emitted.dispose();
  });
});

type MemberValues = {
  title: string;
  members: Array<{
    id: string;
    name: string;
  }>;
};

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
      title: field<string>(),
    },
    arrays: {
      members: arrayField<MemberValues['members'][number]>({
        getItemId: (item) => item.id,
      }),
    },
  });
}

function collectPatches(form: {
  onPatch(listener: (patches: readonly FormPatch[]) => void): () => void;
}) {
  const batches: FormPatch[][] = [];
  const dispose = form.onPatch((patches) => {
    batches.push([...patches]);
  });

  return {
    batches,
    dispose,
    take(): readonly FormPatch[] {
      const batch = batches.shift();

      if (batch === undefined) {
        throw new Error('Expected a patch batch to be emitted.');
      }

      return batch;
    },
  };
}
