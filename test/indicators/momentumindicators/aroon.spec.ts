
import * as jsonfile from "jsonfile";
import * as path from "path";
import * as indicators from "../../../src/indicators/";
import { TestDataFactory } from "../../testData";

describe("AROON Indicator", () => {
    let taResultFile: string;
    let sourceData: any;
    let taResultData: any;
    let indicator: indicators.AROON;
    let indicatorResults: Array<{ aroonUp: number, aroonDown: number }>;
    let indicatorOnDataRasied: boolean = false;
    const timePeriod = 14;

    beforeEach(() => {
        taResultFile = path.resolve("./test/talib-results/aroon.json");
        sourceData = TestDataFactory.getInstance().sourceData;
        taResultData = jsonfile.readFileSync(taResultFile);
        indicatorResults = new Array<{ aroonUp: number, aroonDown: number }>(sourceData.close.length - taResultData.begIndex);
    });

    describe("when constructing", () => {
        beforeEach(() => {
            indicator = new indicators.AROON(timePeriod);
        });

        it("should set the indicator name", () => {
            expect(indicator.name).toBe(indicators.AROON.INDICATOR_NAME);
        });

        it("should set the indicator description", () => {
            expect(indicator.description).toBe(indicators.AROON.INDICATOR_DESCR);
        });

        it("should match the talib lookback", () => {
            expect(taResultData.begIndex).toBe(indicator.lookback);
        });
    });

    describe("when constructing with explicit non default arguments", () => {
        beforeEach(() => {
            indicator = new indicators.AROON(timePeriod + 1);
        });

        it("should set the timePeriod", () => {
            expect(indicator.timePeriod).toBe(timePeriod + 1);
        });
    });

    describe("when constructing with default arguments", () => {
        beforeEach(() => {
            indicator = new indicators.AROON();
        });

        it("should set the timePeriod", () => {
            expect(indicator.timePeriod).toBe(indicators.AROON.TIMEPERIOD_DEFAULT);
        });
    });

    describe("when constructing with timePeriod less than the minimum", () => {
        let exception: Error;

        beforeEach(() => {
            try {
                indicator = new indicators.AROON(0);
            } catch (error) {
                exception = error;
            }
        });

        it("should return a correctly formatted error", () => {
            const message = indicators.generateMinTimePeriodError(indicator.name, indicators.AROON.TIMEPERIOD_MIN, 0);
            expect(exception.message).toBe(message);
        });
    });

    describe("when receiving all tick data", () => {
        beforeEach(() => {
            indicator = new indicators.AROON(timePeriod);
            let idx = 0;
            sourceData.close.forEach((value: number, index: number) => {
                if (indicator.receiveData({
                    "high": sourceData.high[index],
                    "low": sourceData.low[index],
                    "open": sourceData.open[index],
                    "close": sourceData.close[index],
                })) {
                    indicatorResults[idx] = { "aroonUp": 0, "aroonDown": 0 };
                    indicatorResults[idx].aroonDown = indicator.aroonDown;
                    indicatorResults[idx].aroonUp = indicator.aroonUp;
                    idx++;
                }
            });
        });

        it("should match the talib aroonup results", () => {
            for (let i = 0; i < taResultData.result.outAroonUp.length; i++) {
                expect(isNaN(indicatorResults[i].aroonUp)).toBe(false);
                expect(taResultData.result.outAroonUp[i]).toBeCloseTo(indicatorResults[i].aroonUp, 0.001);
            }
        });

        it("should match the talib aroondown results", () => {
            for (let i = 0; i < taResultData.result.outAroonDown.length; i++) {
                expect(isNaN(indicatorResults[i].aroonDown)).toBe(false);
                expect(taResultData.result.outAroonDown[i]).toBeCloseTo(indicatorResults[i].aroonDown, 0.001);
            }
        });

        it("should match the talib lookback", () => {
            expect(taResultData.begIndex).toBe(indicator.lookback);
        });
    });

    describe("when receiving less tick data than the lookback period", () => {
        beforeEach(() => {
            indicator = new indicators.AROON(timePeriod);
            let idx = 0;
            indicatorOnDataRasied = false;
            indicator.on("data", () => {
                indicatorOnDataRasied = true;
            });

            for (let index = 0; index < indicator.lookback; index++) {
                if (indicator.receiveData({
                    "close": sourceData.close[index],
                    "high": sourceData.high[index],
                    "low": sourceData.low[index],
                    "open": sourceData.open[index],
                })) {
                    indicatorResults[idx] = { "aroonUp": 0, "aroonDown": 0 };
                    indicatorResults[idx].aroonDown = indicator.aroonDown;
                    indicatorResults[idx].aroonUp = indicator.aroonUp;
                    idx++;
                }
            }
        });

        it("the indicator should not indicate that it is ready to be consumed", () => {
            expect(indicator.isReady).toBe(false);
        });

        it("should not have raised the ondata event", () => {
            expect(indicatorOnDataRasied).toBe(false);
        });
    });

    describe("when receiving tick data equal to the lookback period", () => {
        beforeEach(() => {
            indicator = new indicators.AROON(timePeriod);
            let idx = 0;
            indicatorOnDataRasied = false;
            indicator.on("data", () => {
                indicatorOnDataRasied = true;
            });

            for (let index = 0; index <= indicator.lookback; index++) {
                if (indicator.receiveData({
                    "close": sourceData.close[index],
                    "high": sourceData.high[index],
                    "low": sourceData.low[index],
                    "open": sourceData.open[index],
                })) {
                    indicatorResults[idx] = { "aroonUp": 0, "aroonDown": 0 };
                    indicatorResults[idx].aroonDown = indicator.aroonDown;
                    indicatorResults[idx].aroonUp = indicator.aroonUp;
                    idx++;
                }
            }
        });

        it("the indicator should indicate that it is ready to be consumed", () => {
            expect(indicator.isReady).toBe(true);
        });

        it("should have raised the ondata event", () => {
            expect(indicatorOnDataRasied).toBe(true);
        });
    });
});
