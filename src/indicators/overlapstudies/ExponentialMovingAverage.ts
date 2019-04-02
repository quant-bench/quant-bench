import * as indicators from "../";

export class ExponentialMovingAverage extends indicators.AbstractIndicator<
  number
> {
  public static INDICATOR_NAME: string = "EMA";
  public static INDICATOR_DESCR: string = "Exponential Moving Average";
  public static TIMEPERIOD_DEFAULT: number = 30;
  public static TIMEPERIOD_MIN: number = 2;

  public timePeriod: number;

  private multiplier: number;
  private periodCounter: number;
  private previousEma: number;
  private periodTotal: number;

  constructor(
    timePeriod: number = ExponentialMovingAverage.TIMEPERIOD_DEFAULT
  ) {
    super(
      ExponentialMovingAverage.INDICATOR_NAME,
      ExponentialMovingAverage.INDICATOR_DESCR
    );

    if (timePeriod < ExponentialMovingAverage.TIMEPERIOD_MIN) {
      throw new Error(
        indicators.generateMinTimePeriodError(
          this.name,
          ExponentialMovingAverage.TIMEPERIOD_MIN,
          timePeriod
        )
      );
    }

    this.timePeriod = timePeriod;
    this.multiplier = 2 / (timePeriod + 1);
    this.periodCounter = timePeriod * -1;
    this.periodTotal = 0;

    this.setLookBack(this.timePeriod - 1);
  }

  public receiveData(inputData: number): boolean {
    this.periodCounter += 1;
    if (this.periodCounter < 0) {
      this.periodTotal += inputData;
    } else if (this.periodCounter === 0) {
      this.periodTotal += inputData;
      this.setCurrentValue(this.periodTotal / this.timePeriod);
    } else if (this.periodCounter > 0) {
      this.setCurrentValue(
        (inputData - this.previousEma) * this.multiplier + this.previousEma
      );
    }
    this.previousEma = this.currentValue;
    return this.isReady;
  }
}

export class EMA extends ExponentialMovingAverage {}
