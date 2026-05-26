declare module "safe-regex" {
  function safeRegex(re: string | RegExp, opts?: { limit?: number }): boolean;
  export = safeRegex;
}
