module.exports = {
    routes: [
        {
            method: "GET",
            path: "/get-available-services",
            handler: "account.getAvailableServices",
        },
        {
            method: "POST",
            path: "/create-subscription",
            handler: "account.createSubscription",
        },
        {
            method: "GET",
            path: "/get-subscriptions",
            handler: "account.getSubscriptions",
        },
        {
            method: "GET",
            path: "/get-subscription-portal",
            handler: "account.getSubscriptionPortal",
        },
        {
            method: "GET",
            path: "/get-discord-rooms",
            handler: "account.getDiscordRooms",
        },
    ],
};
