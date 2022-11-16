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
        {
            method: "GET",
            path: "/get-expert-subscriptions",
            handler: "account.getExpertSubscriptions",
        },
        {
            method: "GET",
            path: "/get-daily-discord-room",
            handler: "account.getDailyDiscordRooms",
        },
        {
            method: "GET",
            path: "/get-schedule",
            handler: "account.getSchedule",
        },
    ],
};
