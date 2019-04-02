import * as indicators from "../";
import * as marketData from "../../data/market/";

export class AccumulationDistributionOscillator extends indicators.AbstractIndicator<
  marketData.IPriceBar
> {
  public static INDICATOR_NAME: string = "ADOSC";
  public static INDICATOR_DESCR: string = "Chaikin A/D Oscillator";
  public static SLOW_TIMEPERIOD_DEFAULT: number = 10;
  public static SLOW_TIMEPERIOD_MIN: number = 2;
  public static FAST_TIMEPERIOD_DEFAULT: number = 3;
  public static FAST_TIMEPERIOD_MIN: number = 2;

  public slowTimePeriod: number;
  public fastTimePeriod: number;

  private ad: indicators.AD;
  private slowEMA: number;
  private fastEMA: number;
  private fastK: number;
  private oneMinusFastK: number;
  private slowK: number;
  private oneMinusSlowK: number;
  private periodCounter: number;

  constructor(
    slowTimePeriod: number = AccumulationDistributionOscillator.SLOW_TIMEPERIOD_DEFAULT,
    fastTimePeriod: number = AccumulationDistributionOscillator.FAST_TIMEPERIOD_DEFAULT
  ) {
    super(
      AccumulationDistributionOscillator.INDICATOR_NAME,
      AccumulationDistributionOscillator.INDICATOR_DESCR
    );

    if (
      slowTimePeriod < AccumulationDistributionOscillator.SLOW_TIMEPERIOD_MIN
    ) {
      throw new Error(
        indicators.generateMinTimePeriodError(
          this.name,
          AccumulationDistributionOscillator.SLOW_TIMEPERIOD_MIN,
          slowTimePeriod
        )
      );
    }

    if (
      fastTimePeriod < AccumulationDistributionOscillator.FAST_TIMEPERIOD_MIN
    ) {
      throw new Error(
        indicators.generateMinTimePeriodError(
          this.name,
          AccumulationDistributionOscillator.FAST_TIMEPERIOD_MIN,
          fastTimePeriod
        )
      );
    }

    this.slowTimePeriod = slowTimePeriod;
    this.fastTimePeriod = fastTimePeriod;
    this.periodCounter = 0;

    this.ad = new indicators.AD();
    // this.ad.on("data", (data: number) => this.receiveADData(data));
    this.slowEMA = 0; // new indicators.EMA(this.slowTimePeriod);
    // this.slowEMA.on("data", (data: number) => this.receiveSlowEMAData(data));
    this.fastEMA = 0; // new indicators.EMA(this.fastTimePeriod);
    this.fastK = this.periodToK(this.fastTimePeriod);
    this.oneMinusFastK = 1.0 - this.fastK;
    this.slowK = this.periodToK(this.slowTimePeriod);
    this.oneMinusSlowK = 1.0 - this.slowK;
    this.periodCounter = -1;

    let slowestPeriod: number = 0;
    fastTimePeriod < slowTimePeriod
      ? (slowestPeriod = slowTimePeriod)
      : (slowestPeriod = fastTimePeriod);

    this.setLookBack(slowestPeriod - 1);
  }

  public receiveData(inputData: marketData.IPriceVolumeBar): boolean {
    this.periodCounter++;
    this.ad.receiveData(inputData);

    if (this.periodCounter === 0) {
      this.fastEMA = this.ad.currentValue;
      this.slowEMA = this.ad.currentValue;
    } else if (this.periodCounter < this.lookback) {
      this.fastEMA =
        this.fastK * this.ad.currentValue + this.oneMinusFastK * this.fastEMA;
      this.slowEMA =
        this.slowK * this.ad.currentValue + this.oneMinusSlowK * this.slowEMA;
    } else {
      this.fastEMA =
        this.fastK * this.ad.currentValue + this.oneMinusFastK * this.fastEMA;
      this.slowEMA =
        this.slowK * this.ad.currentValue + this.oneMinusSlowK * this.slowEMA;
      this.setCurrentValue(this.fastEMA - this.slowEMA);
    }

    return this.isReady;
  }

  private periodToK(period: number): number {
    return 2 / (period + 1);
  }
}

export class ADOSC extends AccumulationDistributionOscillator {}
