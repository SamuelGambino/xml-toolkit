import { default as axios } from "axios";
import { defineStore } from 'pinia'

interface IRespObj {
    id: number;
    name: string;
}

interface IApiResponse {
    [key: string]: unknown;
    salesPoints?: Array<IRespObj>;
    priceLists?: Array<IRespObj>;
}

export interface IResponse {
    salesPoints: IApiResponse | undefined;
    priceLists: IApiResponse | undefined;
    nomenclature: IApiResponse | undefined;
    orderStatus: IApiResponse | undefined;
}

interface ISbisOrg {
    sbisToken: string;
    salesPoint?: number;
    priceList?: number;
    orderId?: string;
}

interface IState {
    sbisOrg: ISbisOrg;
    response: IResponse;
    isLoading: boolean;
    error: string | null
}

export const useSbisStore = defineStore('sbis', {
    state: (): IState => ({
        sbisOrg: { sbisToken: "" },
        response: {
            salesPoints: undefined,
            priceLists: undefined,
            nomenclature: undefined,
            orderStatus: undefined
        },
        isLoading: false,
        error: null
    }),

    actions: {
        setOrg(data: Partial<ISbisOrg>) {
            Object.assign(this.sbisOrg, data);
            if (this.error) this.error = null;
        },

        isCorrectReq() {
            if (!this.sbisOrg.sbisToken || this.sbisOrg.sbisToken === "") {
                throw new Error("Токен не задан!");
            }
        },

        async getSalesPoints() {
            try {
                this.isLoading = true;
                this.isCorrectReq();

                const res = await axios<IApiResponse>({
                    url: 'http://localhost:3001/api/sales-points',
                    method: 'GET',
                    headers: { 'x-sbis-token': this.sbisOrg?.sbisToken }
                });

                Object.assign(this.response, {
                    salesPoints: res.data,
                    priceLists: undefined,
                    nomenclature: undefined,
                    orderStatus: undefined
                });
            } catch (e: any) {
                this.error = e.message;
                throw e;
            } finally {
                this.isLoading = false;
            }
        },

        async getPriceLists() {
            try {
                this.isLoading = true;
                this.isCorrectReq();

                const res = await axios({
                    url: `http://localhost:3001/api/price-lists`,
                    method: 'GET',
                    headers: { "x-sbis-token": this.sbisOrg.sbisToken },
                    params: { pointId: this.sbisOrg.salesPoint }
                });

                Object.assign(this.response, { priceLists: res.data });
            } catch (e: any) {
                this.error = e.message;
                throw e;
            } finally {
                this.isLoading = false;
            }
        },

        async getNomenclature() {
            try {
                this.isLoading = true;
                this.isCorrectReq();

                const res = await axios({
                    url: `http://localhost:3001/api/nomenclature`,
                    method: 'GET',
                    headers: { "x-sbis-token": this.sbisOrg.sbisToken },
                    params: {
                        pointId: this.sbisOrg.salesPoint,
                        priceListId: this.sbisOrg.priceList
                    }
                });

                Object.assign(this.response, { nomenclature: res.data });
            } catch (e: any) {
                this.error = e.message;
                throw e;
            } finally {
                this.isLoading = false;
            }
        },

        async getOrderStatus() {
            try {
                this.isLoading = true;
                this.isCorrectReq();

                const res = await axios({
                    url: `http://localhost:3001/api/order/${this.sbisOrg.orderId}`,
                    method: 'GET',
                    headers: { "x-sbis-token": this.sbisOrg.sbisToken }
                });

                Object.assign(this.response, { orderStatus: res.data });
            } catch (e: any) {
                this.error = e.message;
                throw e;
            } finally {
                this.isLoading = false;
            }
        }
    }
});
// jwE2j7tlfyxx7SzLZPMuyxKGtrKj7IjO6N5GHh5pd6OK0YPrAxDiaDSrZVDnlgU3vMCLgSTNlemdVztkW9FZywgYhCQNm6d0GSXUA8zjYSjd3FIL0UMBQZ