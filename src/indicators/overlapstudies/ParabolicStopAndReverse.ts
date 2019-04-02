import * as indicators from "../";
import * as marketData from "../../data/market/";

export class ParabolicStopAndReverse extends indicators.AbstractIndicator<
  marketData.IPriceBar
> {
  public static INDICATOR_NAME: string = "SAR";
  public static INDICATOR_DESCR: string = "Parabolic SAR";
  public static ACCELERATION_FACTOR: number = 0.02;
  public static ACCELERATION_FACTOR_MAX: number = 0.2;

  public accelerationFactor: number;
  public accelerationFactorMax: number;

  private timePeriod: number;
  private periodCounter: number;
  private extremePoint: number;
  private acceleration: number;
  private previousSar: number;
  private previousHigh: number;
  private previousLow: number;
  private minusDm: indicators.MINUSDM;
  private hasInitialDirection: boolean;
  private isLong: boolean;

  constructor(
    accelerationFactor: number = ParabolicStopAndReverse.ACCELERATION_FACTOR,
    accelerationFactorMax: number = ParabolicStopAndReverse.ACCELERATION_FACTOR_MAX
  ) {
    super(
      ParabolicStopAndReverse.INDICATOR_NAME,
      ParabolicStopAndReverse.INDICATOR_DESCR
    );

    this.timePeriod = 1;
    this.acceleration = this.accelerationFactor = accelerationFactor;
    this.accelerationFactorMax = accelerationFactorMax;
    this.minusDm = new indicators.MINUSDM(this.timePeriod);
    this.minusDm.on("data", (data: number) => {
      this.receiveMINUSDMData(data);
    });
    this.periodCounter = -2;
    this.previousSar = 0;
    this.previousHigh = 0;
    this.previousLow = 0;
    this.hasInitialDirection = false;
    this.isLong = false;
    this.setLookBack(1);
  }

  public receiveData(inputData: marketData.IPriceBar): boolean {
    this.periodCounter += 1;
    if (this.hasInitialDirection === false) {
      this.minusDm.receiveData(inputData);
    }

    if (this.hasInitialDirection === true) {
      if (this.periodCounter === 0) {
        if (this.isLong) {
          this.extremePoint = inputData.high;
          this.previousSar = this.previousLow;
        } else {
          this.extremePoint = inputData.low;
          this.previousSar = this.previousHigh;
        }

        // this is a trick for the first iteration only, the high low of the first bar
        // will be used as the sar for the second bar. According tyo TALib this is the
        // closest to Wilders originla idea of having the first entry day use the
        // previous extreme, except now that extreme is solely derived from the first
        // bar, supposedly Meta stock uses the same method.
        this.previousHigh = inputData.high;
        this.previousLow = inputData.low;
      }

      if (this.periodCounter >= 0) {
        if (this.isLong) {
          if (inputData.low <= this.previousSar) {
            // switch to short if the low penetrates the Sar value
            this.isLong = false;
            this.previousSar = this.extremePoint;

            // make sure the overridden Sar is within yesterdays and todays range
            if (this.previousSar < this.previousHigh) {
              this.previousSar = this.previousHigh;
            }
            if (this.previousSar < inputData.high) {
              this.previousSar = inputData.high;
            }

            this.setCurrentValue(this.previousSar);

            // adjust af and extremePoint
            this.acceleration = this.accelerationFactor;
            this.extremePoint = inputData.low;

            // calculate the new Sar
            this.previousSar =
              this.previousSar +
              this.acceleration * (this.extremePoint - this.previousSar);

            // make sure the overridden Sar is within yesterdays and todays range
            if (this.previousSar < this.previousHigh) {
              this.previousSar = this.previousHigh;
            }

            if (this.previousSar < inputData.high) {
              this.previousSar = inputData.high;
            }
          } else {
            // no switch just output the current Sar
            this.setCurrentValue(this.previousSar);

            if (inputData.high > this.extremePoint) {
              // adjust af and extremePoint
              this.extremePoint = inputData.high;
              this.acceleration += this.accelerationFactor;
              if (this.acceleration > this.accelerationFactorMax) {
                this.acceleration = this.accelerationFactorMax;
              }
            }

            // calculate the new Sar
            this.previousSar =
              this.previousSar +
              this.acceleration * (this.extremePoint - this.previousSar);

            // make sure the overridden Sar is within yesterdays and todays range
            if (this.previousSar > this.previousLow) {
              this.previousSar = this.previousLow;
            }
            if (this.previousSar > inputData.low) {
              this.previousSar = inputData.low;
            }
          }
        } else {
          // short switch to long if the high penetrates the Sar value
          if (inputData.high >= this.previousSar) {
            this.isLong = true;
            this.previousSar = this.extremePoint;

            // make sure the overridden Sar is within yesterdays and todays range
            if (this.previousSar > this.previousLow) {
              this.previousSar = this.previousLow;
            }
            if (this.previousSar > inputData.low) {
              this.previousSar = inputData.low;
            }

            this.setCurrentValue(this.previousSar);

            // adjust af and extremePoint
            this.acceleration = this.accelerationFactor;
            this.extremePoint = inputData.high;

            // calculate the new Sar
            this.previousSar =
              this.previousSar +
              this.acceleration * (this.extremePoint - this.previousSar);

            // make sure the overridden Sar is within yesterdays and todays range
            if (this.previousSar > this.previousLow) {
              this.previousSar = this.previousLow;
            }
            if (this.previousSar > inputData.low) {
              this.previousSar = inputData.low;
            }
          } else {
            // no switch just output the current Sar
            this.setCurrentValue(this.previousSar);

            if (inputData.low < this.extremePoint) {
              // adjust af and extremePoint
              this.extremePoint = inputData.low;
              this.acceleration += this.accelerationFactor;
              if (this.acceleration > this.accelerationFactorMax) {
                this.acceleration = this.accelerationFactorMax;
              }
            }

            // calculate the new Sar
            this.previousSar =
              this.previousSar +
              this.acceleration * (this.extremePoint - this.previousSar);

            // make sure the overridden Sar is within yesterdays and todays range
            if (this.previousSar < this.previousHigh) {
              this.previousSar = this.previousHigh;
            }
            if (this.previousSar < inputData.high) {
              this.previousSar = inputData.high;
            }
          }
        }
      }
    }

    this.previousHigh = inputData.high;
    this.previousLow = inputData.low;

    return this.isReady;
  }

  private receiveMINUSDMData(data: number) {
    data > 0 ? (this.isLong = false) : (this.isLong = true);

    this.hasInitialDirection = true;
  }
}

export class SAR extends ParabolicStopAndReverse {}
