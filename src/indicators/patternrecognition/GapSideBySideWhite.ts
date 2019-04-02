import * as indicators from "../";
import * as marketData from "../../data/market/";
import { SlidingWindow } from "../SlidingWindow";
import * as candleEnums from "./candleEnums";
import { CandleSettings } from "./candleSettings";
import { CandleStickUtils } from "./candleUtils";

export class GapSideBySideWhite extends indicators.AbstractIndicator<
  marketData.IPriceBar
> {
  public static INDICATOR_NAME: string = "CDLGAPSIDESIDEWHITE";
  public static INDICATOR_DESCR: string =
    "Up/Down-gap side-by-side white lines";

  private nearPeriodTotal: number;

  private nearAveragePeriod: number;

  private equalPeriodTotal: number;

  private equalAveragePeriod: number;

  private slidingWindow: SlidingWindow<marketData.IPriceBar>;

  private thirdCandle: marketData.IPriceBar;
  private secondCandle: marketData.IPriceBar;
  private firstCandle: marketData.IPriceBar;
  private thirdCandleColor: candleEnums.CandleColor;
  private secondCandleColor: candleEnums.CandleColor;
  private firstCandleColor: candleEnums.CandleColor;

  constructor() {
    super(
      GapSideBySideWhite.INDICATOR_NAME,
      GapSideBySideWhite.INDICATOR_DESCR
    );

    this.nearAveragePeriod = CandleSettings.get(
      candleEnums.CandleSettingType.Near
    ).averagePeriod;
    this.nearPeriodTotal = 0;
    this.equalAveragePeriod = CandleSettings.get(
      candleEnums.CandleSettingType.Equal
    ).averagePeriod;
    this.equalPeriodTotal = 0;

    const lookback =
      Math.max(this.nearAveragePeriod, this.equalAveragePeriod) + 2;
    this.slidingWindow = new SlidingWindow<marketData.IPriceBar>(lookback + 1);
    this.setLookBack(lookback);
  }

  public receiveData(inputData: marketData.IPriceBar): boolean {
    this.slidingWindow.add(inputData);

    if (!this.slidingWindow.isReady) {
      this.seedSlidingWindow(inputData);
      return this.isReady;
    }

    this.populateCandleVariables();

    if (
      this.upsideOrDownsideGapExistsBetweenFirstAndOtherCandles() &&
      this.secondAndThirdCandlesAreWhite() &&
      this.secondAndThirdCandlesHaveSimilarOpensAndSize()
    ) {
      this.setCurrentValue(
        CandleStickUtils.getRealBodyGapUp(this.secondCandle, this.firstCandle)
          ? 100
          : -100
      );
    } else {
      this.setCurrentValue(0);
    }

    this.nearPeriodTotal +=
      CandleStickUtils.getCandleRange(
        candleEnums.CandleSettingType.Near,
        this.slidingWindow.getItem(1)
      ) -
      CandleStickUtils.getCandleRange(
        candleEnums.CandleSettingType.Near,
        this.slidingWindow.getItem(1 + this.nearAveragePeriod)
      );

    this.equalPeriodTotal +=
      CandleStickUtils.getCandleRange(
        candleEnums.CandleSettingType.Equal,
        this.slidingWindow.getItem(1)
      ) -
      CandleStickUtils.getCandleRange(
        candleEnums.CandleSettingType.Equal,
        this.slidingWindow.getItem(1 + this.equalAveragePeriod)
      );
    return this.isReady;
  }

  private populateCandleVariables() {
    this.firstCandle = this.slidingWindow.getItem(2);
    this.secondCandle = this.slidingWindow.getItem(1);
    this.thirdCandle = this.slidingWindow.getItem(0);
    this.thirdCandleColor = CandleStickUtils.getCandleColor(this.thirdCandle);
    this.secondCandleColor = CandleStickUtils.getCandleColor(this.secondCandle);
    this.firstCandleColor = CandleStickUtils.getCandleColor(this.firstCandle);
  }
  private seedSlidingWindow(inputData: marketData.IPriceBar) {
    if (
      this.slidingWindow.samples >=
      this.slidingWindow.period - this.nearAveragePeriod
    ) {
      this.nearPeriodTotal += CandleStickUtils.getCandleRange(
        candleEnums.CandleSettingType.Near,
        this.slidingWindow.getItem(1)
      );
    }

    if (
      this.slidingWindow.samples >=
      this.slidingWindow.period - this.equalAveragePeriod
    ) {
      this.equalPeriodTotal += CandleStickUtils.getCandleRange(
        candleEnums.CandleSettingType.Equal,
        this.slidingWindow.getItem(1)
      );
    }
  }

  private upsideOrDownsideGapExistsBetweenFirstAndOtherCandles() {
    return (
      (CandleStickUtils.getRealBodyGapUp(this.secondCandle, this.firstCandle) &&
        CandleStickUtils.getRealBodyGapUp(
          this.thirdCandle,
          this.firstCandle
        )) ||
      (CandleStickUtils.getRealBodyGapDown(
        this.secondCandle,
        this.firstCandle
      ) &&
        CandleStickUtils.getRealBodyGapDown(this.thirdCandle, this.firstCandle))
    );
  }

  private secondAndThirdCandlesAreWhite() {
    return (
      this.secondCandleColor === candleEnums.CandleColor.White &&
      this.thirdCandleColor === candleEnums.CandleColor.White
    );
  }

  private secondAndThirdCandlesHaveSimilarOpensAndSize() {
    return (
      CandleStickUtils.getRealBody(this.thirdCandle) >=
        CandleStickUtils.getRealBody(this.secondCandle) -
          CandleStickUtils.getCandleAverage(
            candleEnums.CandleSettingType.Near,
            this.nearPeriodTotal,
            this.secondCandle
          ) &&
      CandleStickUtils.getRealBody(this.thirdCandle) <=
        CandleStickUtils.getRealBody(this.secondCandle) +
          CandleStickUtils.getCandleAverage(
            candleEnums.CandleSettingType.Near,
            this.nearPeriodTotal,
            this.secondCandle
          ) &&
      // same open 2 and 3
      this.thirdCandle.open >=
        this.secondCandle.open -
          CandleStickUtils.getCandleAverage(
            candleEnums.CandleSettingType.Equal,
            this.equalPeriodTotal,
            this.secondCandle
          ) &&
      this.thirdCandle.open <=
        this.secondCandle.open +
          CandleStickUtils.getCandleAverage(
            candleEnums.CandleSettingType.Equal,
            this.equalPeriodTotal,
            this.secondCandle
          )
    );
  }
}

export class CDLGAPSIDESIDEWHITE extends GapSideBySideWhite {}
