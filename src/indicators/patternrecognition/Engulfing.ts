import * as indicators from "../";
import * as marketData from "../../data/market/";
import { SlidingWindow } from "../SlidingWindow";
import * as candleEnums from "./candleEnums";
import { CandleSettings } from "./candleSettings";
import { CandleStickUtils } from "./candleUtils";

export class Engulfing extends indicators.AbstractIndicator<
  marketData.IPriceBar
> {
  public static INDICATOR_NAME: string = "CDLENGULFING";
  public static INDICATOR_DESCR: string = "Engulfing Pattern";

  private slidingWindow: SlidingWindow<marketData.IPriceBar>;

  private secondCandle: marketData.IPriceBar;
  private firstCandle: marketData.IPriceBar;
  private secondCandleColor: candleEnums.CandleColor;
  private firstCandleColor: candleEnums.CandleColor;

  constructor() {
    super(Engulfing.INDICATOR_NAME, Engulfing.INDICATOR_DESCR);

    const lookback = 2;
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
      // white engulfs black
      (this.secondCandleColor === candleEnums.CandleColor.White &&
        this.firstCandleColor === candleEnums.CandleColor.Black &&
        ((this.secondCandle.close >= this.firstCandle.open &&
          this.secondCandle.open < this.firstCandle.close) ||
          (this.secondCandle.close > this.firstCandle.open &&
            this.secondCandle.open <= this.firstCandle.close))) ||
      // black engulfs white
      (this.secondCandleColor === candleEnums.CandleColor.Black &&
        this.firstCandleColor === candleEnums.CandleColor.White &&
        ((this.secondCandle.open >= this.firstCandle.close &&
          this.secondCandle.close < this.firstCandle.open) ||
          (this.secondCandle.open > this.firstCandle.close &&
            this.secondCandle.close <= this.firstCandle.open)))
    ) {
      if (
        this.secondCandle.open !== this.firstCandle.close &&
        this.secondCandle.close !== this.firstCandle.open
      ) {
        this.setCurrentValue(this.secondCandleColor * 100);
      } else {
        this.setCurrentValue(this.secondCandleColor * 80);
      }
    } else {
      this.setCurrentValue(0);
    }
    return this.isReady;
  }

  private populateCandleVariables() {
    this.firstCandle = this.slidingWindow.getItem(1);
    this.secondCandle = this.slidingWindow.getItem(0);
    this.secondCandleColor = CandleStickUtils.getCandleColor(this.secondCandle);
    this.firstCandleColor = CandleStickUtils.getCandleColor(this.firstCandle);
  }
}

export class CDLENGULFING extends Engulfing {}
