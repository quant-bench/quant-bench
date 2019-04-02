import * as indicators from "../";

export class Trix extends indicators.AbstractIndicator<number> {
  public static INDICATOR_NAME: string = "TRIX";
  public static INDICATOR_DESCR: string =
    "1-day Rate-Of-Change (ROC) of a Triple Smooth EMA";
  public static TIMEPERIOD_DEFAULT: number = 30;
  public static TIMEPERIOD_MIN: number = 1;

  public timePeriod: number;
  private ema1: indicators.EMA;
  private ema2: indicators.EMA;
  private ema3: indicators.EMA;
  private roc: indicators.ROC;

  constructor(timePeriod: number = Trix.TIMEPERIOD_DEFAULT) {
    super(Trix.INDICATOR_NAME, Trix.INDICATOR_DESCR);

    if (timePeriod < Trix.TIMEPERIOD_MIN) {
      throw new Error(
        indicators.generateMinTimePeriodError(
          this.name,
          Trix.TIMEPERIOD_MIN,
          timePeriod
        )
      );
    }

    this.timePeriod = timePeriod;
    this.ema1 = new indicators.EMA(this.timePeriod);
    this.ema1.on("data", (data: number) => this.receiveEMA1Data(data));

    this.ema2 = new indicators.EMA(this.timePeriod);
    this.ema2.on("data", (data: number) => this.receiveEMA2Data(data));

    this.ema3 = new indicators.EMA(this.timePeriod);
    this.ema3.on("data", (data: number) => this.receiveEMA3Data(data));

    this.roc = new indicators.ROC(1);
    this.roc.on("data", (data: number) => this.receiveROCData(data));
    this.setLookBack(3 * this.ema1.lookback + this.roc.lookback);
  }

  public receiveData(inputData: number): boolean {
    this.ema1.receiveData(inputData);
    return this.isReady;
  }

  private receiveEMA1Data(data: number) {
    this.ema2.receiveData(data);
  }

  private receiveEMA2Data(data: number) {
    this.ema3.receiveData(data);
  }

  private receiveEMA3Data(data: number) {
    this.roc.receiveData(data);
  }

  private receiveROCData(data: number) {
    this.setCurrentValue(data);
  }
}

export class TRIX extends Trix {}
