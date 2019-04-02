import * as indicators from "../";
import * as marketData from "../../data/market/";
import { SlidingWindow } from "../SlidingWindow";
import * as candleEnums from "./candleEnums";
import { CandleSettings } from "./candleSettings";
import { CandleStickUtils } from "./candleUtils";

export class ThreeOutside extends indicators.AbstractIndicator<
  marketData.IPriceBar
> {
  public static INDICATOR_NAME: string = "CDL3OUTSIDE";
  public static INDICATOR_DESCR: string = "Three Outside Up/Down";

  private slidingWindow: SlidingWindow<marketData.IPriceBar>;

  private thirdCandle: marketData.IPriceBar;
  private secondCandle: marketData.IPriceBar;
  private firstCandle: marketData.IPriceBar;
  private thirdCandleColor: candleEnums.CandleColor;
  private secondCandleColor: candleEnums.CandleColor;
  private firstCandleColor: candleEnums.CandleColor;

  constructor() {
    super(ThreeOutside.INDICATOR_NAME, ThreeOutside.INDICATOR_DESCR);

    const lookback = 3;
    this.slidingWindow = new SlidingWindow<marketData.IPriceBar>(lookback + 1);
    this.setLookBack(lookback);
  }

  public receiveData(inputData: marketData.IPriceBar): boolean {
    this.slidingWindow.add(inputData);

    if (!this.slidingWindow.isReady) {
      return this.isReady;
    }

    this.populateCandleVariables();

    if (
      this.firstBlackCandleIsEngulfedByRisingWhiteCandles() ||
      this.firstWhiteCandleIsEngulfedByFallingBlackCandles()
    ) {
      this.setCurrentValue(this.secondCandleColor * 100);
    } else {
      this.setCurrentValue(0);
    }
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

  private firstBlackCandleIsEngulfedByRisingWhiteCandles(): boolean {
    return (
      this.firstCandleColor === candleEnums.CandleColor.Black &&
      this.secondCandleColor === candleEnums.CandleColor.White &&
      this.secondCandle.close > this.firstCandle.open &&
      this.secondCandle.open < this.firstCandle.close &&
      this.thirdCandle.close > this.secondCandle.close
    );
  }

  private firstWhiteCandleIsEngulfedByFallingBlackCandles(): boolean {
    return (
      this.firstCandleColor === candleEnums.CandleColor.White &&
      this.secondCandleColor === candleEnums.CandleColor.Black &&
      this.secondCandle.open > this.firstCandle.close &&
      this.secondCandle.close < this.firstCandle.open &&
      this.thirdCandle.close < this.secondCandle.close
    );
  }
}

export class CDL3OUTSIDE extends ThreeOutside {}
