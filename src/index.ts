import { GraphQLClient, Variables } from 'graphql-request'
import { LuxorPool } from './types.js'
import { Big } from 'big.js'

export * from './types.js'

export class Luxor {

    private key: string | undefined
    private coin: LuxorPool.MiningProfileName | undefined
    private units: LuxorPool.HashRateUnits | undefined
    private client: GraphQLClient = new GraphQLClient('https://api.beta.luxor.tech/graphql')
    
    constructor(options: LuxorPool.ConstructorOptions) {
        this.key = options.key
        this.coin = options.coin
        this.units = options.units
    }

    /**
     * Returns a list of all subaccounts on your Luxor account. Pagination defaults to the first 1,000 subaccounts.
     * 
     * {@link https://docs.luxor.tech/docs/schema/queries/get-subaccount-access-list Official API Documentation}
     */
    public async getSubaccounts(options: LuxorPool.PaginationOptions = { first: 1000 }) {
        const query = `query getSubaccountAccessList($first: Int, $last: Int, $offset: Int) {
            users(first: $first, last: $last, offset: $offset) {
                nodes {
                    username
                }
            }
        }`
        const args = { first: options.first, last: options.last, offset: options.offset }
        const response = await this.callAPI(query, args)
        return response.users.nodes.map((node: any) => node.username) as string[]
    }

    /**
     * Returns a list of all workers on a subaccount.
     * 
     * {@link https://docs.luxor.tech/docs/schema/queries/get-worker-list Official API Documentation}
     */
    public async getWorkerDetails(subaccount: string, options: LuxorPool.WorkerDetailsOptions) {
        const query = `query getWorkerDetails($mpn: MiningProfileName!, $duration: IntervalInput!, $uname: String!, $first: Int, $last: Int, $offset: Int) {
            getWorkerDetails(mpn: $mpn, duration: $duration, uname: $uname, first: $first, last: $last, offset: $offset) {
                edges {
                    node {
                        minerId
                        workerName
                        miningProfileName
                        updatedAt
                        status
                        hashrate
                        validShares
                        staleShares
                        invalidShares
                        lowDiffShares
                        badShares
                        duplicateShares
                        revenue
                        efficiency
                    }
                }
            }
        }`
        const args = {
            mpn: options.coin || this.coin,
            duration: options.duration || { days: 7 },
            uname: subaccount,
            first: options.pagination?.first || (options.pagination?.last ? null : 10000),
            last: options.pagination?.last,
            offset: options.pagination?.offset
        }
        const response = await this.callAPI(query, args)
        return response.getWorkerDetails.edges.map((edge: any) => edge.node).map((worker: any) => {
            const date = new Date(worker.updatedAt)
            date.setHours(date.getHours() - 5)
            return {
                id: worker.minerId,
                name: worker.workerName,
                coin: worker.miningProfileName,
                updatedAt: date,
                status: worker.status,
                hashrate: this.convertHashrateUnits(worker.hashrate || 0, options.units || this.units!),
                validShares: parseInt(worker.validShares || 0),
                staleShares: parseInt(worker.staleShares || 0),
                invalidShares: parseInt(worker.invalidShares || 0),
                lowDiffShares: parseInt(worker.lowDiffShares || 0),
                badShares: parseInt(worker.badShares || 0),
                duplicateShares: parseInt(worker.duplicateShares || 0),
                revenue: worker.revenue,
                efficiency: parseFloat(worker.efficiency || 0)
            }
        }) as LuxorPool.Worker[]
    }

    /**
     * Returns the hashrate history of a worker.
     * 
     * {@link https://docs.luxor.tech/docs/schema/queries/get-worker-hashrate-history Official API Documentation}
     */
    public async getWorkerHashrate(subaccount: string, worker: string, options: LuxorPool.WorkerHashrateOptions) {
        const query = `query getWorkerHashrateHistory($username: String!, $workerName: String!, $mpn: MiningProfileName!, $inputBucket: HashrateIntervals!, $inputDuration: HashrateIntervals!, $first: Int, $last: Int, $offset: Int) {
            getWorkerHashrateHistory(username: $username, workerName: $workerName, mpn: $mpn, inputDuration: $inputDuration, inputBucket: $inputBucket, first: $first, last: $last, offset: $offset) {
                edges {
                    node {
                        time,
                        hashrate,
                        dataPoints
                    }
                }
            }
        }`
        const args = {
            username: subaccount,
            workerName: worker,
            mpn: options.coin || this.coin,
            inputDuration: options.duration,
            inputBucket: options.bucket,
            first: options.pagination?.first,
            last: options.pagination?.last,
            offset: options.pagination?.offset
        }
        const response = await this.callAPI(query, args)
        return response.getWorkerHashrateHistory.edges.map((edge: any) => edge.node).map((node: any) => {
            return {
                time: new Date(node.time),
                hashrate: this.convertHashrateUnits(node.hashrate, options.units || this.units!),
                dataPoints: parseInt(node.dataPoints)
            }
        }) as LuxorPool.WorkerHashrate[]
    }

    /**
     * Returns the subaccount mining summary.
     * 
     * {@link https://docs.luxor.tech/docs/schema/objects/coin-mining-overview Official API Documentation}
     */
    public async getSubaccountSummary(subaccount: string, duration: LuxorPool.HashrateDurationInterval, units?: LuxorPool.HashRateUnits, coin?: LuxorPool.MiningProfileName) {
        const query = `query getMiningSummary($mpn: MiningProfileName!, $userName: String!, $inputDuration: HashrateIntervals!) {
            getMiningSummary(mpn: $mpn, userName: $userName, inputDuration: $inputDuration) {
                username
                validShares
                invalidShares
                staleShares
                lowDiffShares
                badShares
                duplicateShares
                revenue
                hashrate
            }
        }`
        const args = {
            mpn: coin || this.coin,
            inputDuration: duration,
            userName: subaccount
        }
        const { getMiningSummary } = await this.callAPI(query, args)
        return {
            username: getMiningSummary.username,
            validShares: parseInt(getMiningSummary.validShares || 0),
            invalidShares: parseInt(getMiningSummary.invalidShares || 0),
            staleShares: parseInt(getMiningSummary.staleShares || 0),
            lowDiffShares: parseInt(getMiningSummary.lowDiffShares || 0),
            badShares: parseInt(getMiningSummary.badShares || 0),
            duplicateShares: parseInt(getMiningSummary.duplicateShares || 0),
            revenue: getMiningSummary.revenue,
            hashrate: this.convertHashrateUnits(getMiningSummary.hashrate || 0, units || this.units!)
        }
    }

    /**
     * Returns the subaccount hash rate history.
     * 
     * {@link https://docs.luxor.tech/docs/schema/queries/get-all-subaccounts-hashrate-history Official API Documentation}
     */
    public async getAllSubaccountsHashrate(interval: LuxorPool.HashrateDurationInterval, units?: LuxorPool.HashRateUnits, coin?: LuxorPool.MiningProfileName, pagination: LuxorPool.PaginationOptions = { first: 100 }) {
        const query = `query getAllSubaccountsHashrateHistory($mpn: MiningProfileName!, $inputInterval: HashrateIntervals, $first: Int, $last: Int, $offset: Int) {
            getAllSubaccountsHashrateHistory(mpn: $mpn, inputInterval: $inputInterval, first: $first, last: $last, offset: $offset) {
                edges {
                    node {
                        hashrateHistory
                        username
                    }
                }
            }
        }`
        const args = {
            mpn: coin || this.coin,
            inputInterval: interval,
            first: pagination.first,
            last: pagination.last,
            offset: pagination.offset
        }
        const response = await this.callAPI(query, args)
        return response.getAllSubaccountsHashrateHistory.edges.map((edge: any) => edge.node).map((node: any) => {
            const history = node.hashrateHistory.map((history: any) => {
                return {
                    time: new Date(history.time),
                    hashrate: this.convertHashrateUnits(history.hashrate || 0, units || this.units!),
                    dataPoints: parseInt(history.data_points)
                }
            })
            return {
                username: node.username,
                history
            }
        }) as LuxorPool.SubaccountHashrate[]
    }

    /**
     * Returns the total hashrate for a parent account / profile.
     * 
     * {@link https://docs.luxor.tech/docs/schema/queries/get-profile-hashrate Official API Documentation}
     */
    public async getProfileHashrate(units?: LuxorPool.HashRateUnits, coin?: LuxorPool.MiningProfileName) {
        const query = `query getProfileHashrate($mpn: MiningProfileName!) {
            getProfileHashrate(mpn: $mpn)
        }`
        const args = { mpn: coin || this.coin }
        const response = await this.callAPI(query, args)
        return this.convertHashrateUnits(response.getProfileHashrate, units || this.units!)
    }

    /**
     * Returns the hashrate history of all subaccounts.
     * 
     * {@link https://docs.luxor.tech/docs/schema/queries/get-profile-hashrate-history Official API Documentation}
     */
    public async getProfileHashrateScore(subaccount: string, units?: LuxorPool.HashRateUnits, coin?: LuxorPool.MiningProfileName, pagination: LuxorPool.PaginationOptions = { first: 100 }) {
        const query = `query getHashrateScoreHistory($mpn: MiningProfileName!, $uname: String!, $first: Int, $last: Int, $offset: Int) {
            getHashrateScoreHistory(mpn: $mpn, uname: $uname, first: $first, last: $last, offset: $offset, orderBy: DATE_DESC) {
                nodes {
                    date
                    efficiency
                    hashrate
                    revenue
                    uptimePercentage
                    uptimeTotalMinutes
                    uptimeTotalMachines
                }
            }
        }`
        const args = {
            mpn: coin || this.coin,
            uname: subaccount,
            first: pagination.first,
            last: pagination.last,
            offset: pagination.offset
        }
        const response = await this.callAPI(query, args)
        return response.getHashrateScoreHistory.nodes.map((node: any) => {
            return {
                date: new Date(node.date),
                efficiency: parseFloat(node.efficiency),
                hashrate: this.convertHashrateUnits(node.hashrate || 0, units || this.units!),
                revenue: parseFloat(node.revenue),
                uptimePercentage: parseFloat(node.uptimePercentage),
                uptimeTotalMinutes: parseInt(node.uptimeTotalMinutes),
                uptimeTotalMachines: parseInt(node.uptimeTotalMachines)
            }
        })
    }

    /**
     * Returns the transaction history of a subaccount. Pagination defaults to the first 100 transactions.
     * 
     * {@link https://docs.luxor.tech/docs/schema/queries/get-transaction-history Official API Documentation}
     */
    public async getTransactionHistory(subaccount: string, coin?: LuxorPool.MiningProfileName, options: LuxorPool.PaginationOptions = { first: 100 }) {
        const query = `query getTransactionHistory($uname: String!, $cid: CurrencyProfileName!, $first: Int, $last: Int, $offset: Int) {
            getTransactionHistory(uname: $uname, cid: $cid, first: $first, last: $last, offset: $offset, orderBy: CREATED_AT_DESC) {
                edges {
                    node {
                        amount
                        coinPrice
                        createdAt
                        rowId
                        status
                        transactionId
                    }
                }
            }
        }`
        const args = {
            uname: subaccount,
            cid: coin || this.coin,
            first: options.first,
            last: options.last,
            offset: options.offset
        }
        const data = await this.callAPI(query, args)
        return data.getTransactionHistory.edges.map((edge: any) => edge.node).map((transaction: any) => {
            const date = new Date(transaction.createdAt)
            date.setHours(date.getHours() - 5)
            return {
                id: transaction.transactionId,
                status: transaction.status,
                amount: transaction.amount,
                createdAt: date,
                coinPrice: parseFloat(transaction.coinPrice)
            }
        }) as LuxorPool.Transaction[]
    }
    
    /**
     * Returns the total pool hashrate at Luxor.
     * 
     * {@link https://docs.luxor.tech/docs/schema/queries/get-pool-hashrate Official API Documentation}
     */
    public async getPoolHashrate(units?: LuxorPool.HashRateUnits, coin?: LuxorPool.MiningProfileName) {
        const query = `query getPoolHashrate($mpn: MiningProfileName!, $orgSlug: String!) {
            getPoolHashrate(mpn: $mpn, orgSlug: $orgSlug)
        }`
        const args = { mpn: coin || this.coin, orgSlug: 'luxor' }
        const response = await this.callAPI(query, args)
        return this.convertHashrateUnits(response.getPoolHashrate, units || this.units!)
    }

    /**
     * Calls the Luxor Pool API.
     */
    private async callAPI(query: string, args?: Variables): Promise<any> {
        if (typeof this.key === 'string') {
            return await this.client.request(query, args, {
                'X-LUX-API-KEY': this.key
            })
        }
        else {
            throw new Error('No Luxor Pool API key provided!')
        }    
    }

    /**
     * Converts the hashrate to the specified units.
     */
    private convertHashrateUnits(hashrate: string, units: LuxorPool.HashRateUnits) {
        const bigHashrate = Big(hashrate)
        if (units === 'H') {
            return bigHashrate.toNumber()
        }
        if (units === 'KH') {
            return bigHashrate.div(1000).toNumber()
        }
        if (units === 'MH') {
            return bigHashrate.div(1000).div(1000).toNumber()
        }
        if (units === 'GH') {
            return bigHashrate.div(1000).div(1000).div(1000).toNumber()
        }
        if (units === 'TH') {
            return bigHashrate.div(1000).div(1000).div(1000).div(1000).toNumber()
        }
        if (units === 'PH') {
            return bigHashrate.div(1000).div(1000).div(1000).div(1000).div(1000).toNumber()
        }
        if (units === 'EH') {
            return bigHashrate.div(1000).div(1000).div(1000).div(1000).div(1000).div(1000).toNumber()
        }
        if (units === 'ZH') {
            return bigHashrate.div(1000).div(1000).div(1000).div(1000).div(1000).div(1000).div(1000).toNumber()
        }
        else {
            throw Error('Unexpected hash rate units: ' + units + '. Expected one of: H, KH, MH, GH, TH, PH, EH, ZH')
        }
    }

}
