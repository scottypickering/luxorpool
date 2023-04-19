export namespace LuxorPool {
    
    export interface ConstructorOptions {
        key: string
        coin?: MiningProfileName
        units?: HashRateUnits
    }
    
    export type HashRateUnits = "H" | "KH" | "MH" | "GH" | "TH" | "PH" | "EH" | "ZH"
    
    export type MiningProfileName = "ARRR" | "BTC" | "DASH" | "DCR" | "KMD" | "LBC" | "SC" | "SCP" | "ZEC" | "ZEN" | "EQUI" | "TBTC" | "ETH" | "TETH"
    
    export interface DetailsDurationInterval {
        seconds?: number
        minutes?: number
        hours?: number
        days?: number
        months?: number
        years?: number
    }

    export type HashrateDurationInterval = "_15_MINUTE" | "_1_HOUR" | "_6_HOUR" | "_1_DAY"

    export type PaginationOptions = {
        first?: number
        last?: number
        offset?: number
    }
    
    export interface WorkerDetailsOptions {
        duration?: DetailsDurationInterval
        coin?: MiningProfileName
        units?: HashRateUnits
        pagination?: PaginationOptions
    }
    
    export interface WorkerHashrateOptions {
        duration: HashrateDurationInterval
        bucket: HashrateDurationInterval
        coin?: MiningProfileName
        units?: HashRateUnits
        pagination: PaginationOptions
    }
    
    export interface Worker {
        id: number,
        name: string,
        coin: MiningProfileName,
        updatedAt: Date,
        status: string,
        hashrate: number,
        validShares: number,
        staleShares: number,
        invalidShares: number,
        lowDiffShares: number,
        badShares: number,
        duplicateShares: number,
        revenue: string,
        efficiency: number
    }

    export interface SubaccountHashrate {
        username: string
        history: WorkerHashrate[]
    }

    export interface WorkerHashrate {
        time: Date,
        hashrate: number,
        dataPoints: number
    }
    
    export interface Transaction {
        id: string,
        status: string,
        amount: string,
        createdAt: Date,
        coinPrice: number
    }
}
