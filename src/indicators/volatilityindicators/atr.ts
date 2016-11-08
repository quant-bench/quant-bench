import * as indicators from "../";
import * as marketData from "../../data/market/";

export class ATR
    extends indicators.AbstractIndicator<marketData.IPriceBar> {

    static INDICATOR_NAME: string = "ATR";
    static INDICATOR_DESCR: string = "Average True Range";
    static TIMEPERIOD_DEFAULT: number = 14;
    static TIMEPERIOD_MIN: number = 1;

    public timePeriod: number;
    private previousAvgTrueRange: number;
    private multiplier: number;
    private trueRange: indicators.TRANGE;
    private sma: indicators.SMA;

    constructor(timePeriod: number = ATR.TIMEPERIOD_DEFAULT) {
        super(ATR.INDICATOR_NAME, ATR.INDICATOR_DESCR);

        if (timePeriod < ATR.TIMEPERIOD_MIN) {
            throw (new Error(indicators.generateMinTimePeriodError(this.name, ATR.TIMEPERIOD_MIN, timePeriod)));
        }

        this.timePeriod = timePeriod;

        this.multiplier = timePeriod - 1;
        this.previousAvgTrueRange = -1;
        this.sma = new indicators.SMA(timePeriod);
        this.sma.on("data", (data: number) => this.receiveSMAData(data));
        this.trueRange = new indicators.TRANGE();
        this.trueRange.on("data", (data: number) => this.receiveTRANGEData(data));
        this.setLookBack(this.timePeriod);
    }

    receiveData(inputData: marketData.IPriceBar): boolean {
        this.trueRange.receiveData(inputData);
        return this.isReady;
    }

    private receiveSMAData(data: number) {
        this.previousAvgTrueRange = data;
        this.setCurrentValue(data);
    }

    private receiveTRANGEData(data: number) {
        if (this.previousAvgTrueRange === -1) {
            this.sma.receiveData(data);
        } else {
            this.setCurrentValue(((this.previousAvgTrueRange * this.multiplier) + data) / this.timePeriod);

            // update the previous true range for the next tick
            this.previousAvgTrueRange = this.currentValue;
        }
    }
}
