import * as indicators from "../";
import * as marketData from "../../data/market/";
import { SlidingWindow } from "../SlidingWindow";
import * as candleEnums from "./candleEnums";
import { CandleSettings } from "./candleSettings";
import { CandleStickUtils } from "./candleUtils";

export class Doji extends indicators.AbstractIndicator<marketData.IPriceBar> {
  public static INDICATOR_NAME: string = "CDLDOJI";
  public static INDICATOR_DESCR: string = "Doji";

  private bodyDojiPeriodTotal: number;
  private bodyDojiAveragePeriod: number;
  private slidingWindow: SlidingWindow<marketData.IPriceBar>;
  private firstCandle: marketData.IPriceBar;
  private firstCandleColor: candleEnums.CandleColor;

  constructor() {
    super(Doji.INDICATOR_NAME, Doji.INDICATOR_DESCR);

    this.bodyDojiAveragePeriod = CandleSettings.get(
      candleEnums.CandleSettingType.BodyDoji
    ).averagePeriod;
    this.bodyDojiPeriodTotal = 0;

    const lookback = this.bodyDojiAveragePeriod;
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

    this.setCurrentValue(this.hasVerySmallRealBody() ? 100 : 0);

    this.bodyDojiPeriodTotal +=
      CandleStickUtils.getCandleRange(
        candleEnums.CandleSettingType.BodyDoji,
        inputData
      ) -
      CandleStickUtils.getCandleRange(
        candleEnums.CandleSettingType.BodyDoji,
        this.slidingWindow.getItem(this.bodyDojiAveragePeriod)
      );

    return this.isReady;
  }

  private populateCandleVariables() {
    this.firstCandle = this.slidingWindow.getItem(0);
    this.firstCandleColor = CandleStickUtils.getCandleColor(this.firstCandle);
  }

  private seedSlidingWindow(inputData: marketData.IPriceBar) {
    if (
      this.slidingWindow.samples >=
      this.slidingWindow.period - this.bodyDojiAveragePeriod
    ) {
      this.bodyDojiPeriodTotal += CandleStickUtils.getCandleRange(
        candleEnums.CandleSettingType.BodyDoji,
        inputData
      );
    }
  }

  private hasVerySmallRealBody(): boolean {
    return (
      CandleStickUtils.getRealBody(this.firstCandle) <=
      CandleStickUtils.getCandleAverage(
        candleEnums.CandleSettingType.BodyDoji,
        this.bodyDojiPeriodTotal,
        this.firstCandle
      )
    );
  }
}

export class CDLDOJI extends Doji {}
