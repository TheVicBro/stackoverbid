export const endpoints = {
  auth: {
    signup: "/auth/signup",
    login: "/auth/login",
  },
  catalogue: {
    items: "/catalogue/items",
    itemById: (id: number | string) => `/catalogue/items/${id}`,
  },
  auction: {
    createItem: "/auction/items",
    placeBid: (id: number | string) => `/auction/items/${id}/bid`,
  },
  payment: {
    pay: (id: number | string) => `/payment/items/${id}/pay`,
  },
  notifications: {
    list: "/notifications/",
    ws: (userId: number | string) => `/notifications/ws/${userId}`,
    broadcastEnd: (itemId: number | string) =>
      `/notifications/items/${itemId}/broadcast-end`,
  },
};