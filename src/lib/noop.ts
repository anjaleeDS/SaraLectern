export default {};

// fs / fs/promises stubs
export const readFile = () => Promise.reject(new Error('not in browser'));
export const writeFile = () => Promise.reject(new Error('not in browser'));
export const readdir = () => Promise.reject(new Error('not in browser'));
export const stat = () => Promise.reject(new Error('not in browser'));
export const lstat = () => Promise.reject(new Error('not in browser'));
export const realpath = () => Promise.reject(new Error('not in browser'));
export const readlink = () => Promise.reject(new Error('not in browser'));
export const mkdir = () => Promise.reject(new Error('not in browser'));
export const unlink = () => Promise.reject(new Error('not in browser'));
export const open = () => Promise.reject(new Error('not in browser'));
export const rename = () => Promise.reject(new Error('not in browser'));
export const existsSync = () => false;
export const readFileSync = () => '';

// path stubs
export const join = (...args: string[]) => args.join('/');
export const resolve = (...args: string[]) => args.join('/');
export const dirname = (p: string) => p.split('/').slice(0, -1).join('/');
export const basename = (p: string) => p.split('/').pop() || '';
export const isAbsolute = (p: string) => p.startsWith('/');
export const sep = '/';
export const extname = (p: string) => { const i = p.lastIndexOf('.'); return i > 0 ? p.slice(i) : ''; };

// os stubs
export const homedir = () => '/';
export const platform = () => 'browser';
export const tmpdir = () => '/tmp';

// stream stubs
export const Readable = class {};
export const Writable = class {};
export const pipeline = () => Promise.reject(new Error('not in browser'));

// child_process stubs
export const execFile = () => { throw new Error('not in browser'); };
export const spawn = () => { throw new Error('not in browser'); };

// util stubs
export const promisify = () => () => Promise.reject(new Error('not in browser'));
export const inspect = (v: unknown) => String(v);

// url stubs
export const fileURLToPath = (u: string) => u;
export const pathToFileURL = (p: string) => ({ href: p });

// buffer stubs
export const Buffer = globalThis.Buffer ?? {
  from: (s: string) => new TextEncoder().encode(s),
  isBuffer: () => false,
};
