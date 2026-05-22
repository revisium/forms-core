const tanstackEventTarget = new EventTarget();

tanstackEventTarget.addEventListener('tanstack-connect', () => {
  tanstackEventTarget.dispatchEvent(createTanstackConnectSuccessEvent());
});

const globalWithTanstackEventTarget = globalThis as typeof globalThis & {
  __TANSTACK_EVENT_TARGET__?: EventTarget | null;
};

globalWithTanstackEventTarget.__TANSTACK_EVENT_TARGET__ = tanstackEventTarget;

afterAll(async () => {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 350);
  });

  globalWithTanstackEventTarget.__TANSTACK_EVENT_TARGET__ = null;
});

function createTanstackConnectSuccessEvent(): Event {
  if (typeof CustomEvent === 'undefined') {
    return new Event('tanstack-connect-success');
  }

  return new CustomEvent('tanstack-connect-success');
}
