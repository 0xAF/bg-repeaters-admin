export type ModeSwitch = { enabled: boolean } & Record<string, unknown>;

export type DSTARMode = ModeSwitch & {
  reflector?: string;
  module?: string;
  gateway?: string;
  info?: string;
};

export type FusionMode = ModeSwitch & {
  reflector?: string;
  tg?: string;
  room?: string;
  dgid?: string;
  wiresx_node?: string;
  info?: string;
};

export type DMRMode = ModeSwitch & {
  network?: string;
  color_code?: string;
  ts1_groups?: string;
  ts2_groups?: string;
  info?: string;
  callid?: string;
  reflector?: string;
};

export type NXDNMode = ModeSwitch & { network?: string; ran?: string };

export interface RepeaterFormModel {
  callsign: string;
  keeper: string;
  latitude: number;
  longitude: number;
  place: string;
  location?: string;
  qth?: string;
  altitude?: number;
  power?: number;
  disabled?: boolean;
  modes: {
    fm: ModeSwitch;
    am: ModeSwitch;
    usb: ModeSwitch;
    lsb: ModeSwitch;
    dmr: DMRMode;
    dstar: DSTARMode;
    fusion: FusionMode;
    nxdn: NXDNMode;
    parrot: ModeSwitch;
    beacon: ModeSwitch;
  };
  freq: { rx: number; tx: number; tone?: number | null; channel?: string };
  internet: { echolink?: number; allstarlink?: number; zello?: string; other?: string };
  coverage_map_json?: string;
  info?: string;
}

export interface RepeaterPayload extends Omit<RepeaterFormModel, 'info'> {
  info?: string[];
}

function deepClone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val)) as T;
}

export function createEmptyRepeaterFormModel(): RepeaterFormModel {
  return {
    callsign: '',
    keeper: '',
    latitude: 0,
    longitude: 0,
    place: '',
    location: '',
    qth: '',
    altitude: 0,
    power: 0,
    disabled: false,
    modes: {
      fm: { enabled: false },
      am: { enabled: false },
      usb: { enabled: false },
      lsb: { enabled: false },
      dmr: { enabled: false },
      dstar: { enabled: false },
      fusion: { enabled: false },
      nxdn: { enabled: false },
      parrot: { enabled: false },
      beacon: { enabled: false },
    },
    freq: { rx: 0, tx: 0 },
    internet: {},
    info: '',
  };
}

function mergeMode<T extends ModeSwitch>(incoming: T | undefined, fallback: T): T {
  if (incoming && typeof incoming === 'object') {
    return { ...fallback, ...incoming };
  }
  return { ...fallback };
}

type PartialModes = Partial<RepeaterFormModel['modes']>;

function isPartialModes(val: unknown): val is PartialModes {
  return typeof val === 'object' && val !== null;
}

type PartialFreq = Partial<RepeaterFormModel['freq']>;
type PartialInternet = Partial<RepeaterFormModel['internet']>;

function isPartialFreq(val: unknown): val is PartialFreq {
  return typeof val === 'object' && val !== null;
}

function isPartialInternet(val: unknown): val is PartialInternet {
  return typeof val === 'object' && val !== null;
}

export function mergeRepeaterFormModel(
  source?: Partial<RepeaterFormModel> | null,
  base?: RepeaterFormModel,
): RepeaterFormModel {
  const target = base ? deepClone(base) : createEmptyRepeaterFormModel();
  if (!source) return target;

  if (typeof source.callsign === 'string') target.callsign = source.callsign;
  if (typeof source.keeper === 'string') target.keeper = source.keeper;
  if (typeof source.latitude === 'number') target.latitude = source.latitude;
  if (typeof source.longitude === 'number') target.longitude = source.longitude;
  if (typeof source.place === 'string') target.place = source.place;
  if (typeof source.location === 'string') target.location = source.location;
  if (typeof source.qth === 'string') target.qth = source.qth;
  if (typeof source.altitude === 'number') target.altitude = source.altitude;
  if (typeof source.power === 'number') target.power = source.power;
  if (typeof source.disabled === 'boolean') target.disabled = source.disabled;
  if (typeof source.coverage_map_json === 'string') target.coverage_map_json = source.coverage_map_json;

  const defaults = createEmptyRepeaterFormModel().modes;
  const incomingModes = isPartialModes(source.modes) ? source.modes : undefined;
  target.modes = {
    fm: mergeMode(incomingModes?.fm, target.modes.fm || defaults.fm),
    am: mergeMode(incomingModes?.am, target.modes.am || defaults.am),
    usb: mergeMode(incomingModes?.usb, target.modes.usb || defaults.usb),
    lsb: mergeMode(incomingModes?.lsb, target.modes.lsb || defaults.lsb),
    dmr: mergeMode(incomingModes?.dmr, target.modes.dmr || defaults.dmr),
    dstar: mergeMode(incomingModes?.dstar, target.modes.dstar || defaults.dstar),
    fusion: mergeMode(incomingModes?.fusion, target.modes.fusion || defaults.fusion),
    nxdn: mergeMode(incomingModes?.nxdn, target.modes.nxdn || defaults.nxdn),
    parrot: mergeMode(incomingModes?.parrot, target.modes.parrot || defaults.parrot),
    beacon: mergeMode(incomingModes?.beacon, target.modes.beacon || defaults.beacon),
  };

  if (isPartialFreq(source.freq)) {
    target.freq = { ...target.freq, ...source.freq };
  }
  if (isPartialInternet(source.internet)) {
    target.internet = { ...target.internet, ...source.internet };
  }

  if (Array.isArray(source.info)) {
    target.info = source.info.join('\n');
  } else if (typeof source.info === 'string') {
    target.info = source.info;
  }

  return target;
}

export function buildRepeaterPayload(model: RepeaterFormModel): RepeaterPayload {
  const out = deepClone(model);
  const prune = (obj: Record<string, unknown>) => {
    Object.keys(obj).forEach((key) => {
      if (key === 'enabled') return;
      const value = obj[key];
      if (value === '' || value === null || value === undefined) {
        delete obj[key];
      }
    });
  };

  prune(out.modes.dmr as unknown as Record<string, unknown>);
  prune(out.modes.dstar as unknown as Record<string, unknown>);
  prune(out.modes.fusion as unknown as Record<string, unknown>);
  prune(out.modes.nxdn as unknown as Record<string, unknown>);

  const { info, ...rest } = out;
  const payload: RepeaterPayload = { ...rest };
  if (typeof info === 'string') {
    const trimmed = info.trim();
    if (trimmed.length) payload.info = [trimmed];
  }
  return payload;
}
