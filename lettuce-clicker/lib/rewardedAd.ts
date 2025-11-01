import { Platform } from 'react-native';

const moduleId = 'expo-ads-' + 'admob';

type AdMobRewardedType = {
  setAdUnitID: (adUnitID: string) => Promise<void> | void;
  requestAdAsync: () => Promise<void>;
  showAdAsync: () => Promise<void>;
  addEventListener: (event: string, handler: (...args: any[]) => void) => { remove: () => void };
};

type AdMobModule = { AdMobRewarded: AdMobRewardedType };

const TEST_AD_UNIT_IDS = {
  android: 'ca-app-pub-3940256099942544/5224354917',
  ios: 'ca-app-pub-3940256099942544/1712485313',
} as const;

const PRODUCTION_AD_UNIT_IDS = {
  android: 'ca-app-pub-7849823724462832/8779801897',
  ios: 'ca-app-pub-7849823724462832/1639678472',
} as const;

let modulePromise: Promise<AdMobModule | null> | null = null;
let isConfigured = false;
let isLoading = false;
let isLoaded = false;

function resolveAdUnitId() {
  const key = Platform.OS === 'android' ? 'android' : Platform.OS === 'ios' ? 'ios' : null;
  if (!key) {
    return null;
  }

  if (__DEV__) {
    return TEST_AD_UNIT_IDS[key];
  }

  return PRODUCTION_AD_UNIT_IDS[key];
}

async function loadModule(): Promise<AdMobModule | null> {
  if (modulePromise) {
    return modulePromise;
  }

  modulePromise = (async () => {
    const adUnitId = resolveAdUnitId();
    if (!adUnitId) {
      return null;
    }

    try {
      const mod = (await import(moduleId)) as AdMobModule;
      return mod;
    } catch (error) {
      console.warn('Rewarded ads module unavailable', error);
      return null;
    }
  })();

  return modulePromise;
}

async function configureAdUnit(admob: AdMobRewardedType) {
  if (isConfigured) {
    return;
  }

  const adUnitId = resolveAdUnitId();
  if (!adUnitId) {
    return;
  }

  try {
    await admob.setAdUnitID(adUnitId);
  } catch (error) {
    console.warn('Failed to configure rewarded ad unit', error);
  }
  isConfigured = true;
}

async function requestAd(admob: AdMobRewardedType) {
  if (isLoaded || isLoading) {
    return isLoaded;
  }

  isLoading = true;
  try {
    await admob.requestAdAsync();
    isLoaded = true;
    return true;
  } catch (error) {
    console.warn('Rewarded ad failed to load', error);
    return false;
  } finally {
    isLoading = false;
  }
}

export async function preloadRewardedAd() {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return false;
  }

  const mod = await loadModule();
  if (!mod) {
    return false;
  }

  await configureAdUnit(mod.AdMobRewarded);
  return requestAd(mod.AdMobRewarded);
}

export async function showRewardedAd(): Promise<'earned' | 'closed' | 'failed'> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return 'failed';
  }

  const mod = await loadModule();
  if (!mod) {
    return 'failed';
  }

  const { AdMobRewarded } = mod;
  await configureAdUnit(AdMobRewarded);

  if (!isLoaded) {
    const loadedSuccessfully = await requestAd(AdMobRewarded);
    if (!loadedSuccessfully) {
      return 'failed';
    }
  }

  return new Promise<'earned' | 'closed' | 'failed'>((resolve) => {
    let rewarded = false;

    const cleanup = () => {
      rewardListener?.remove();
      closeListener?.remove();
      failureListener?.remove();
    };

    const rewardListener = AdMobRewarded.addEventListener('rewardedVideoDidRewardUser', () => {
      rewarded = true;
    });

    const closeListener = AdMobRewarded.addEventListener('rewardedVideoDidClose', async () => {
      cleanup();
      isLoaded = false;
      await requestAd(AdMobRewarded);
      resolve(rewarded ? 'earned' : 'closed');
    });

    const failureListener = AdMobRewarded.addEventListener('rewardedVideoDidFailToLoad', (error) => {
      console.warn('Rewarded ad failed during playback', error);
      cleanup();
      isLoaded = false;
      resolve('failed');
    });

    AdMobRewarded.showAdAsync().catch((error) => {
      console.warn('Failed to display rewarded ad', error);
      cleanup();
      isLoaded = false;
      resolve('failed');
    });
  });
}
