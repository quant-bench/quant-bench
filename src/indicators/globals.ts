import { Queue } from "./queue";

export const INVALID_INDICATOR_MIN_TIMEPERIOD = " requires a time period greater than ";
export const INVALID_INDICATOR_MIN_VOLUMEFACTOR = " requires a volume factor greater than ";
export const INVALID_INDICATOR_MAX_VOLUMEFACTOR = " requires a volume factor less than ";

export function generateMinTimePeriodError(indicatorName: string,
    minTimePeriod: number,
    suppliedTimePeriod: number): string {
    return indicatorName + INVALID_INDICATOR_MIN_TIMEPERIOD + minTimePeriod + ". Time period supplied was " + suppliedTimePeriod;
}

export function generateMinVolumeFactorError(indicatorName: string,
    minVolumeFactor: number,
    suppliedVolumeFactor: number): string {
    return indicatorName + INVALID_INDICATOR_MIN_TIMEPERIOD + minVolumeFactor + ". Volume factor supplied was " + suppliedVolumeFactor;
}

export function generateMaxVolumeFactorError(indicatorName: string,
    maxVolumeFactor: number,
    suppliedVolumeFactor: number): string {
    return indicatorName + INVALID_INDICATOR_MAX_VOLUMEFACTOR + maxVolumeFactor + ". Volume factor supplied was " + suppliedVolumeFactor;
}

export function getQueueMin(queue: Queue<number>) {
    let min = Number.MAX_VALUE;
    queue.toArray().forEach((value: number) => {
        if (min > value) {
            min = value;
        }
    });

    return min;
}

export function getQueueMax(queue: Queue<number>) {
    let max = Number.MIN_VALUE;
    queue.toArray().forEach((value: number) => {
        if (max < value) {
            max = value;
        }
    });

    return max;
}

export function getQueueMinIndex(queue: Queue<number>) {
    let min = Number.MAX_VALUE;
        let idx = -1;
    queue.toArray().forEach((value: number, index: number) => {
        if (min > value) {
            min = value;
            idx = index;
        }
    });

    return idx;
}

export function getQueueMaxIndex(queue: Queue<number>) {
    let max = Number.MIN_VALUE;
    let idx = -1;
    queue.toArray().forEach((value: number, index: number) => {
        if (max < value) {
            max = value;
            idx = index;
        }
    });

    return idx;
}
