export const NODE_TYPES = [
  // OSINT classic
  'PERSON',
  'COMPANY',
  'EVENT',
  'EVIDENCE',
  'LOCATION',
  'CUSTOM',
  // Cyber investigation
  'HOST',
  'DOMAIN',
  'ACCOUNT',
  'WALLET',
  'VULNERABILITY',
  'MALWARE',
  'CREDENTIAL',
  'NETWORK',
] as const;
export type NodeTypeKey = (typeof NODE_TYPES)[number];

/** Categoría de nodo — usada por la Toolbar para agrupar visualmente. */
export type NodeCategory = 'osint' | 'cyber';

export const NODE_TYPE_META: Record<
  NodeTypeKey,
  {
    color: string;
    label: string;
    icon: string;
    description: string;
    category: NodeCategory;
  }
> = {
  // === OSINT ===
  PERSON: {
    color: '#60A5FA',
    label: 'Persona',
    icon: 'user',
    description: 'Individuo identificado',
    category: 'osint',
  },
  COMPANY: {
    color: '#FBBF24',
    label: 'Empresa',
    icon: 'building',
    description: 'Persona jurídica',
    category: 'osint',
  },
  EVENT: {
    color: '#C084FC',
    label: 'Evento',
    icon: 'calendar',
    description: 'Suceso fechable',
    category: 'osint',
  },
  EVIDENCE: {
    color: '#4ADE80',
    label: 'Evidencia',
    icon: 'file',
    description: 'Documento o prueba',
    category: 'osint',
  },
  LOCATION: {
    color: '#FB923C',
    label: 'Ubicación',
    icon: 'map-pin',
    description: 'Lugar geográfico',
    category: 'osint',
  },
  CUSTOM: {
    color: '#94A3B8',
    label: 'Personalizado',
    icon: 'shapes',
    description: 'Otro',
    category: 'osint',
  },
  // === CYBER ===
  HOST: {
    color: '#10b981',
    label: 'Host',
    icon: 'server',
    description: 'Máquina, servidor o endpoint con IP',
    category: 'cyber',
  },
  DOMAIN: {
    color: '#3b82f6',
    label: 'Dominio',
    icon: 'globe',
    description: 'Dominio o subdominio (DNS)',
    category: 'cyber',
  },
  ACCOUNT: {
    color: '#8b5cf6',
    label: 'Cuenta',
    icon: 'at-sign',
    description: 'Perfil en una plataforma online',
    category: 'cyber',
  },
  WALLET: {
    color: '#facc15',
    label: 'Wallet',
    icon: 'wallet',
    description: 'Billetera de criptomoneda',
    category: 'cyber',
  },
  VULNERABILITY: {
    color: '#f97316',
    label: 'Vulnerabilidad',
    icon: 'bug',
    description: 'CVE, finding o exploit',
    category: 'cyber',
  },
  MALWARE: {
    color: '#dc2626',
    label: 'Malware',
    icon: 'alert-triangle',
    description: 'Sample o familia de malware',
    category: 'cyber',
  },
  CREDENTIAL: {
    color: '#ec4899',
    label: 'Credencial',
    icon: 'key-round',
    description: 'Credencial expuesta en breach',
    category: 'cyber',
  },
  NETWORK: {
    color: '#06b6d4',
    label: 'Red / ASN',
    icon: 'network',
    description: 'Bloque CIDR o sistema autónomo',
    category: 'cyber',
  },
};

export const CONNECTION_TYPES = [
  // Classic OSINT
  'FAMILY',
  'PROFESSIONAL',
  'SUSPECT',
  'FINANCIAL',
  'COMMUNICATION',
  'OWNERSHIP',
  'CUSTOM',
  // Cyber
  'RESOLVES_TO',
  'HOSTS',
  'C2_CALLBACK',
  'TRANSACTION',
  'EXPLOITS',
  'CONTROLS',
  'EXPOSED_BY',
  'USES_TOOL',
] as const;
export type ConnectionTypeKey = (typeof CONNECTION_TYPES)[number];

export const CONNECTION_TYPE_META: Record<
  ConnectionTypeKey,
  { color: string; label: string; defaultDirectional: boolean; category: NodeCategory }
> = {
  // OSINT
  FAMILY: { color: '#60A5FA', label: 'Familiar', defaultDirectional: false, category: 'osint' },
  PROFESSIONAL: {
    color: '#94A3B8',
    label: 'Profesional',
    defaultDirectional: false,
    category: 'osint',
  },
  SUSPECT: { color: '#EF4444', label: 'Sospechoso', defaultDirectional: true, category: 'osint' },
  FINANCIAL: {
    color: '#FB923C',
    label: 'Financiero',
    defaultDirectional: true,
    category: 'osint',
  },
  COMMUNICATION: {
    color: '#4ADE80',
    label: 'Comunicación',
    defaultDirectional: false,
    category: 'osint',
  },
  OWNERSHIP: { color: '#C084FC', label: 'Propiedad', defaultDirectional: true, category: 'osint' },
  CUSTOM: { color: '#94A3B8', label: 'Custom', defaultDirectional: true, category: 'osint' },
  // CYBER
  RESOLVES_TO: {
    color: '#3b82f6',
    label: 'Resuelve a',
    defaultDirectional: true,
    category: 'cyber',
  },
  HOSTS: { color: '#10b981', label: 'Hospeda', defaultDirectional: true, category: 'cyber' },
  C2_CALLBACK: {
    color: '#dc2626',
    label: 'C2 callback',
    defaultDirectional: true,
    category: 'cyber',
  },
  TRANSACTION: {
    color: '#facc15',
    label: 'Transacción',
    defaultDirectional: true,
    category: 'cyber',
  },
  EXPLOITS: {
    color: '#f97316',
    label: 'Explota',
    defaultDirectional: true,
    category: 'cyber',
  },
  CONTROLS: {
    color: '#8b5cf6',
    label: 'Controla',
    defaultDirectional: true,
    category: 'cyber',
  },
  EXPOSED_BY: {
    color: '#ec4899',
    label: 'Expuesto por',
    defaultDirectional: true,
    category: 'cyber',
  },
  USES_TOOL: {
    color: '#94A3B8',
    label: 'Usa herramienta',
    defaultDirectional: true,
    category: 'cyber',
  },
};

// === Field whitelists (typed) ===

export const PERSON_FIELDS = [
  'firstName',
  'lastName',
  'aliases',
  'dob',
  'docId',
  'email',
  'phone',
  'address',
  'city',
  'country',
  'occupation',
] as const;

export const COMPANY_FIELDS = [
  'legalName',
  'taxId',
  'founded',
  'jurisdiction',
  'sector',
  'website',
  'address',
] as const;

export const EVENT_FIELDS = ['date', 'endDate', 'location', 'category'] as const;
export const LOCATION_FIELDS = ['address', 'city', 'country', 'lat', 'lng'] as const;

// === Cyber investigation fields ===

export const HOST_FIELDS = [
  'ipv4',
  'ipv6',
  'hostname',
  'mac',
  'os',
  'osVersion',
  'openPorts',
  'services',
  'asn',
  'hostingProvider',
  'country',
  'lastSeen',
  'isOnline',
] as const;

export const DOMAIN_FIELDS = [
  'name',
  'registrar',
  'registrationDate',
  'expiryDate',
  'nameservers',
  'aRecords',
  'mxRecords',
  'whoisOwner',
  'whoisEmail',
  'archiveUrl',
] as const;

export const ACCOUNT_FIELDS = [
  'platform',
  'handle',
  'displayName',
  'profileUrl',
  'userId',
  'creationDate',
  'verified',
  'followerCount',
  'bio',
] as const;

export const WALLET_FIELDS = [
  'chain',
  'address',
  'label',
  'firstSeen',
  'lastActivity',
  'incomingVolumeUsd',
  'outgoingVolumeUsd',
  'tags',
] as const;

export const VULNERABILITY_FIELDS = [
  'cve',
  'cvss',
  'severity',
  'status',
  'affectedProduct',
  'affectedVersions',
  'exploitAvailable',
  'exploitUrl',
  'cwe',
  'bountyAwardedUsd',
] as const;

export const MALWARE_FIELDS = [
  'family',
  'malwareType',
  'md5',
  'sha1',
  'sha256',
  'firstSeen',
  'c2Servers',
  'mitreTechniques',
  'vtScore',
] as const;

export const CREDENTIAL_FIELDS = [
  'login',
  'breach',
  'breachDate',
  'recordCount',
  'dataExposed',
] as const;

export const NETWORK_FIELDS = [
  'cidr',
  'asn',
  'asnOwner',
  'country',
  'region',
  'purpose',
] as const;

/** Plataformas reconocidas para nodos ACCOUNT. Útil para iconos / colores. */
export const ACCOUNT_PLATFORMS = [
  'twitter',
  'github',
  'telegram',
  'discord',
  'reddit',
  'mastodon',
  'instagram',
  'facebook',
  'linkedin',
  'tiktok',
  'youtube',
  'matrix',
  'forum',
  'other',
] as const;
export type AccountPlatform = (typeof ACCOUNT_PLATFORMS)[number];

/** Cadenas de blockchain reconocidas para nodos WALLET. */
export const WALLET_CHAINS = [
  'BTC',
  'ETH',
  'TRX',
  'BSC',
  'SOL',
  'XMR',
  'DOGE',
  'LTC',
  'XRP',
  'ADA',
  'POLYGON',
  'OTHER',
] as const;
export type WalletChain = (typeof WALLET_CHAINS)[number];

/** Severidades de vulnerabilidad. */
export const VULN_SEVERITIES = ['info', 'low', 'medium', 'high', 'critical'] as const;
export type VulnSeverity = (typeof VULN_SEVERITIES)[number];

/** Estados de vulnerabilidad (workflow de bug bounty). */
export const VULN_STATUSES = ['open', 'triaged', 'resolved', 'duplicate', 'wontfix'] as const;
export type VulnStatus = (typeof VULN_STATUSES)[number];
