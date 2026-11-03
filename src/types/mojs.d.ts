declare module '@mojs/core' {
  type BurstInstance = {
    replay: () => void
  }

  const mojs: {
    Burst: new (options: Record<string, unknown>) => BurstInstance
  }

  export default mojs
}
