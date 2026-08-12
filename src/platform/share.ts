// Browser stand-in for react-native's Share, keeping the same result shape
// (`{ action, activityType }`) so the calling store code is unchanged.
//
// navigator.share only exists on mobile browsers and requires a secure context;
// everywhere else we fall back to copying the message to the clipboard.
export const Share = {
  sharedAction: 'sharedAction' as const,
  dismissedAction: 'dismissedAction' as const,

  async share(content: { message: string; title?: string }) {
    if (navigator.share) {
      try {
        await navigator.share({ text: content.message, title: content.title });
        return { action: Share.sharedAction, activityType: null };
      } catch (e) {
        // The user dismissed the sheet, or the browser refused the request.
        return { action: Share.dismissedAction, activityType: null };
      }
    }
    try {
      await navigator.clipboard.writeText(content.message);
      return { action: Share.sharedAction, activityType: 'clipboard' };
    } catch (e) {
      return { action: Share.dismissedAction, activityType: null };
    }
  },
};

export default Share;
