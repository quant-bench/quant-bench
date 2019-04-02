import * as indicators from "../";

export class BollingerBands extends indicators.AbstractIndicatorBase<number> {
  public static INDICATOR_NAME: string = "BBANDS";
  public static INDICATOR_DESCR: string = "Bollinger Bands";
  public static TIMEPERIOD_DEFAULT: number = 5;
  public static TIMEPERIOD_MIN: number = 2;

  public timePeriod: number;

  private upperBandInternal: number;
  private middleBandInternal: number;
  private lowerBandInternal: number;

  private sma: indicators.SMA;
  private stdDev: indicators.STDDEV;
  private currentSma: number;

  constructor(timePeriod: number = BollingerBands.TIMEPERIOD_DEFAULT) {
    super(BollingerBands.INDICATOR_NAME, BollingerBands.INDICATOR_DESCR);

    if (timePeriod < BollingerBands.TIMEPERIOD_MIN) {
      throw new Error(
        indicators.generateMinTimePeriodError(
          this.name,
          BollingerBands.TIMEPERIOD_MIN,
          timePeriod
        )
      );
    }

    this.upperBandInternal = 0;
    this.middleBandInternal = 0;
    this.lowerBandInternal = 0;

    this.timePeriod = timePeriod;
    this.currentSma = 0;
    this.sma = new indicators.SMA(this.timePeriod);
    this.sma.on("data", (data: number) => this.receiveSmaData(data));
    this.stdDev = new indicators.STDDEV(timePeriod);
    this.stdDev.on("data", (data: number) => this.receiveStdDevData(data));
    this.setLookBack(this.timePeriod - 1);
  }

  public receiveData(inputData: number): boolean {
    this.sma.receiveData(inputData);

    this.stdDev.receiveData(inputData);
    return this.isReady;
  }

  public get upperBand(): number {
    return this.upperBandInternal;
  }

  public get middleBand(): number {
    return this.middleBandInternal;
  }

  public get lowerBand(): number {
    return this.lowerBandInternal;
  }

  protected setCurrentValue(
    upperBand: number,
    middleBand: number,
    lowerBand: number
  ) {
    this.upperBandInternal = upperBand;
    this.middleBandInternal = middleBand;
    this.lowerBandInternal = lowerBand;
    this.emit("data", this.upperBand, this.middleBand, this.lowerBand);
    this.setIsReady();
  }

  private receiveSmaData(data: number) {
    this.currentSma = data;
  }

  private receiveStdDevData(data: number) {
    // upperBand = this.currentSma + 2 * data;
    // lowerBand = this.currentSma - 2 * data;
    this.setCurrentValue(
      this.currentSma + 2 * data,
      this.sma.currentValue,
      this.currentSma - 2 * data
    );
  }
}

export class BBANDS extends BollingerBands {}
