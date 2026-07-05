import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import FirebaseCore
import UserNotifications

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {
  var window: UIWindow?
  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // ── 1. Firebase (должен быть первым) ────────────────────────────────────
    FirebaseApp.configure()

    // ── 2. Push-уведомления ─────────────────────────────────────────────────
    UNUserNotificationCenter.current().delegate = self
    UNUserNotificationCenter.current().requestAuthorization(
      options: [.alert, .badge, .sound]
    ) { granted, _ in
      if granted {
        DispatchQueue.main.async {
          application.registerForRemoteNotifications()
        }
      }
    }

    // ── 3. React Native bootstrap ────────────────────────────────────────────
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "DrugsFront",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }

  // ── APNS токен → Firebase Messaging ────────────────────────────────────────
  func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    // @react-native-firebase/messaging подхватит токен автоматически
    // через метод swizzling. Если swizzling отключён — раскомментируйте:
    // Messaging.messaging().apnsToken = deviceToken
  }

  func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
  ) {
    print("[Push] Ошибка регистрации APNS: \(error.localizedDescription)")
  }

  // ── UNUserNotificationCenterDelegate ───────────────────────────────────────

  // Показываем уведомление, когда приложение на переднем плане
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    completionHandler([.banner, .badge, .sound])
  }

  // Обрабатываем тап по уведомлению
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    completionHandler()
  }
}

// ── React Native delegate ───────────────────────────────────────────────────
class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
