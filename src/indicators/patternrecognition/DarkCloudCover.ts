import * as indicators from "../";
import * as marketData from "../../data/market/";
import { SlidingWindow } from "../SlidingWindow";
import * as candleEnums from "./candleEnums";
import { CandleSettings } from "./candleSettings";
import { CandleStickUtils } from "./candleUtils";

export class DarkCloudCover extends indicators.AbstractIndicator<
  marketData.IPriceBar
> {
  public static INDICATOR_NAME: string = "CDLDARKCLOUDCOVER";
  public static INDICATOR_DESCR: string = "Dark Cloud Cover";

  public static PENETRATION_DEFAULT: number = 0.5;
  public static PENETRATION_MIN: number = 0;

  private bodyLongPeriodTotal: number;

  private bodyLongAveragePeriod: number;

  private penetration: number;

  private slidingWindow: SlidingWindow<marketData.IPriceBar>;

  private secondCandle: marketData.IPriceBar;
  private firstCandle: marketData.IPriceBar;
  private secondCandleColor: candleEnums.CandleColor;
  private firstCandleColor: candleEnums.CandleColor;

  constructor(penetration: number = DarkCloudCover.PENETRATION_DEFAULT) {
    super(DarkCloudCover.INDICATOR_NAME, DarkCloudCover.INDICATOR_DESCR);

    this.penetration = penetration;

    this.bodyLongAveragePeriod = CandleSettings.get(
      candleEnums.CandleSettingType.BodyLong
    ).averagePeriod;
    this.bodyLongPeriodTotal = 0;

    const lookback = this.bodyLongAveragePeriod + 1;
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
      this.firstCandleIsLongWhiteCandle() &&
      this.secondCandleIsBlackOpeningAbovePriorHighAndClosingWithinPriorBody()
    ) {
      this.setCurrentValue(-100);
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
        this.slidingWindow.getItem(this.bodyLongAveragePeriod + 1)
      );
    return this.isReady;
  }

  private populateCandleVariables() {
    this.firstCandle = this.slidingWindow.getItem(1);
    this.secondCandle = this.slidingWindow.getItem(0);
    this.secondCandleColor = CandleStickUtils.getCandleColor(this.secondCandle);
    this.firstCandleColor = CandleStickUtils.getCandleColor(this.firstCandle);
  }
  private seedSlidingWindow(inputData: marketData.IPriceBar) {
    if (
      this.slidingWindow.samples >=
      this.slidingWindow.period - this.bodyLongAveragePeriod
    ) {
      this.bodyLongPeriodTotal += CandleStickUtils.getCandleRange(
        candleEnums.CandleSettingType.BodyLong,
        this.slidingWindow.getItem(1)
      );
    }
  }

  private firstCandleIsLongWhiteCandle() {
    return (
      this.firstCandleColor === candleEnums.CandleColor.White &&
      CandleStickUtils.getRealBody(this.firstCandle) >
        CandleStickUtils.getCandleAverage(
          candleEnums.CandleSettingType.BodyLong,
          this.bodyLongPeriodTotal,
          this.firstCandle
        )
    );
  }

  private secondCandleIsBlackOpeningAbovePriorHighAndClosingWithinPriorBody() {
    return (
      this.secondCandleColor === candleEnums.CandleColor.Black &&
      this.secondCandle.open > this.firstCandle.high &&
      this.secondCandle.close > this.firstCandle.open &&
      this.secondCandle.close <
        this.firstCandle.close -
          CandleStickUtils.getRealBody(this.firstCandle) * this.penetration
    );
  }
}

export class CDLDARKCLOUDCOVER extends DarkCloudCover {}
