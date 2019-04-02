import * as indicators from "../";
import * as marketData from "../../data/market/";
import { SlidingWindow } from "../SlidingWindow";
import * as candleEnums from "./candleEnums";
import { CandleSettings } from "./candleSettings";
import { CandleStickUtils } from "./candleUtils";

export class MorningStar extends indicators.AbstractIndicator<
  marketData.IPriceBar
> {
  public static INDICATOR_NAME: string = "CDLMORNINGSTAR";
  public static INDICATOR_DESCR: string = "Morning Star";

  public static PENETRATION_DEFAULT: number = 0.3;
  public static PENETRATION_MIN: number = 0;

  private bodyLongPeriodTotal: number;
  private bodyLongAveragePeriod: number;
  private bodyShortPeriodTotal: number;
  private bodyShortPeriodTotal2: number;
  private bodyShortAveragePeriod: number;

  private firstCandle: marketData.IPriceBar;
  private secondCandle: marketData.IPriceBar;
  private thirdCandle: marketData.IPriceBar;

  private firstCandleColor: candleEnums.CandleColor;
  private secondCandleColor: candleEnums.CandleColor;
  private thirdCandleColor: candleEnums.CandleColor;

  private penetration: number;

  private slidingWindow: SlidingWindow<marketData.IPriceBar>;

  constructor(penetration: number = MorningStar.PENETRATION_DEFAULT) {
    super(MorningStar.INDICATOR_NAME, MorningStar.INDICATOR_DESCR);

    this.penetration = penetration;

    this.bodyLongAveragePeriod = CandleSettings.get(
      candleEnums.CandleSettingType.BodyLong
    ).averagePeriod;
    this.bodyLongPeriodTotal = 0;
    this.bodyShortAveragePeriod = CandleSettings.get(
      candleEnums.CandleSettingType.BodyShort
    ).averagePeriod;
    this.bodyShortPeriodTotal = 0;
    this.bodyShortPeriodTotal2 = 0;

    const lookback =
      Math.max(this.bodyLongAveragePeriod, this.bodyShortAveragePeriod) + 2;
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
      this.firstCandleIsLongBlackCandle() &&
      this.secondCandleIsShortCandleThatGapsDown() &&
      this.thirdCandleIsWhiteCandleLongerThanShortAndClosingWellWithinFirstCandlesRealBody()
    ) {
      this.setCurrentValue(100);
    } else {
      this.setCurrentValue(0);
    }

    this.bodyLongPeriodTotal +=
      CandleStickUtils.getCandleRange(
        candleEnums.CandleSettingType.BodyLong,
        this.firstCandle
      ) -
      CandleStickUtils.getCandleRange(
        candleEnums.CandleSettingType.BodyLong,
        this.slidingWindow.getItem(this.bodyLongAveragePeriod + 2)
      );

    this.bodyShortPeriodTotal +=
      CandleStickUtils.getCandleRange(
        candleEnums.CandleSettingType.BodyShort,
        this.secondCandle
      ) -
      CandleStickUtils.getCandleRange(
        candleEnums.CandleSettingType.BodyShort,
        this.slidingWindow.getItem(this.bodyShortAveragePeriod + 1)
      );

    this.bodyShortPeriodTotal2 +=
      CandleStickUtils.getCandleRange(
        candleEnums.CandleSettingType.BodyShort,
        this.thirdCandle
      ) -
      CandleStickUtils.getCandleRange(
        candleEnums.CandleSettingType.BodyShort,
        this.slidingWindow.getItem(this.bodyShortAveragePeriod)
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
        this.slidingWindow.period - this.bodyLongAveragePeriod - 2 &&
      this.slidingWindow.samples < this.slidingWindow.period - 2
    ) {
      this.bodyLongPeriodTotal += CandleStickUtils.getCandleRange(
        candleEnums.CandleSettingType.BodyLong,
        inputData
      );
    }

    if (
      this.slidingWindow.samples >=
        this.slidingWindow.period - this.bodyShortAveragePeriod - 1 &&
      this.slidingWindow.samples < this.slidingWindow.period - 1
    ) {
      this.bodyShortPeriodTotal += CandleStickUtils.getCandleRange(
        candleEnums.CandleSettingType.BodyShort,
        inputData
      );
      this.bodyShortPeriodTotal2 += CandleStickUtils.getCandleRange(
        candleEnums.CandleSettingType.BodyShort,
        this.slidingWindow.getItem(1)
      );
    }
  }

  private firstCandleIsLongBlackCandle() {
    return (
      CandleStickUtils.getRealBody(this.firstCandle) >
        CandleStickUtils.getCandleAverage(
          candleEnums.CandleSettingType.BodyLong,
          this.bodyLongPeriodTotal,
          this.firstCandle
        ) && this.firstCandleColor === candleEnums.CandleColor.Black
    );
  }

  private secondCandleIsShortCandleThatGapsDown() {
    return (
      CandleStickUtils.getRealBody(this.secondCandle) <=
        CandleStickUtils.getCandleAverage(
          candleEnums.CandleSettingType.BodyShort,
          this.bodyShortPeriodTotal,
          this.secondCandle
        ) &&
      CandleStickUtils.getRealBodyGapDown(this.secondCandle, this.firstCandle)
    );
  }

  private thirdCandleIsWhiteCandleLongerThanShortAndClosingWellWithinFirstCandlesRealBody() {
    return (
      CandleStickUtils.getRealBody(this.thirdCandle) >
        CandleStickUtils.getCandleAverage(
          candleEnums.CandleSettingType.BodyShort,
          this.bodyShortPeriodTotal2,
          this.thirdCandle
        ) &&
      this.thirdCandleColor === candleEnums.CandleColor.White &&
      this.thirdCandle.close >
        this.firstCandle.close +
          CandleStickUtils.getRealBody(this.firstCandle) * this.penetration
    );
  }
}

export class CDLMORNINGSTAR extends MorningStar {}
