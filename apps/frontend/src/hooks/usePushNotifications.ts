// apps/frontend/src/hooks/usePushNotifications.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi, type PushSubscriptionItem } from "@/features/notifications";

export type { PushSubscriptionItem };

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function getBrowserAndDevice() {
  if (typeof window === "undefined") return { browser: "Unknown", device: "Unknown" };
  const ua = navigator.userAgent;
  let browser = "Unknown Browser";
  let device = "Unknown Device";

  if (ua.indexOf("Firefox") > -1) browser = "Firefox";
  else if (ua.indexOf("Chrome") > -1) browser = "Chrome";
  else if (ua.indexOf("Safari") > -1) browser = "Safari";
  else if (ua.indexOf("Edge") > -1) browser = "Edge";

  if (ua.indexOf("Windows") > -1) device = "Windows PC";
  else if (ua.indexOf("Macintosh") > -1) device = "Mac";
  else if (ua.indexOf("Android") > -1) device = "Android Device";
  else if (ua.indexOf("iPhone") > -1) device = "iPhone";
  else if (ua.indexOf("Linux") > -1) device = "Linux PC";

  return { browser, device };
}

/** Hook to fetch active push subscriptions for current user */
export const usePushSubscriptions = () => {
  return useQuery<PushSubscriptionItem[]>({
    queryKey: ["push-subscriptions"],
    queryFn: () => notificationsApi.getPushSubscriptions(),
  });
};

/** Hook to fetch VAPID public key from backend */
export const useVapidPublicKey = () => {
  return useQuery<{ publicKey: string | null }>({
    queryKey: ["vapid-public-key"],
    queryFn: () => notificationsApi.getVapidPublicKey(),
  });
};

/** Hook to subscribe current device to push notifications */
export const useSubscribePush = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Web Push is not supported by your browser");
      }

      // 1. Fetch VAPID public key
      const keyRes = await notificationsApi.getVapidPublicKey();
      const vapidPublicKey = keyRes.publicKey;

      if (!vapidPublicKey) {
        throw new Error("Push notifications server VAPID key is missing");
      }

      // 2. Register Service Worker and subscribe
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const { browser, device } = getBrowserAndDevice();

      const rawP256dh = subscription.getKey("p256dh");
      const rawAuth = subscription.getKey("auth");
      
      const p256dh = rawP256dh
        ? btoa(String.fromCharCode(...new Uint8Array(rawP256dh)))
        : '';
      const auth = rawAuth
        ? btoa(String.fromCharCode(...new Uint8Array(rawAuth)))
        : '';

      // 3. Send subscription to backend
      return await notificationsApi.subscribePush({
        endpoint: subscription.endpoint,
        keys: { p256dh, auth },
        userAgent: `${device} - ${browser}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-subscriptions"] });
    },
  });
};

/** Hook to unsubscribe current device */
export const useUnsubscribePush = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // 1. Inform backend
        await notificationsApi.unsubscribePush({ endpoint: subscription.endpoint });

        // 2. Unsubscribe locally
        await subscription.unsubscribe();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-subscriptions"] });
    },
  });
};

/** Hook to delete a specific registered subscription device by ID */
export const useDeleteSubscriptionDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.deletePushSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-subscriptions"] });
    },
  });
};
