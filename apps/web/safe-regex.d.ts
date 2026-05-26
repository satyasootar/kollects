// Type declaration for safe-regex (pre-existing missing types in @repo/services)
declare module "safe-regex" {
  function safeRegex(re: string | RegExp, opts?: { limit?: number }): boolean;
  export default safeRegex;
}
