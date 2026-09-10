/** Custom event for in-desk navigation during the product tour. */

export type ProductTourDeskPane = "chart" | "trade" | "portfolio"
export type ProductTourMarketView = "chart" | "book"

export type ProductTourNavDetail = {
  deskPane?: ProductTourDeskPane
  marketView?: ProductTourMarketView
}

export const PRODUCT_TOUR_NAV_EVENT = "iris-product-tour-nav"

export function dispatchProductTourNav(detail: ProductTourNavDetail) {
  window.dispatchEvent(
    new CustomEvent<ProductTourNavDetail>(PRODUCT_TOUR_NAV_EVENT, { detail })
  )
}
