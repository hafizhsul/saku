import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans"
import { useFonts } from "expo-font"
import { Stack } from "expo-router"
import { useEffect, useState } from "react"
import { SafeAreaProvider } from "react-native-safe-area-context"
import * as SplashScreen from "expo-splash-screen"
import "react-native-reanimated"
import OnboardingScreen from "./onboarding"

import { BackupProvider } from "../src/features/backup/BackupProvider"
import { BudgetsProvider } from "../src/features/budgets/BudgetsProvider"
import { RecurringProvider } from "../src/features/recurring/RecurringProvider"
import { SettingsProvider } from "../src/features/settings/SettingsProvider"
import { TransactionsProvider } from "../src/features/transactions/TransactionsProvider"
import { getOnboardingDone } from "../src/storage/onboarding"
import { useThemeColors } from "../src/theme"

SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash tetap bisa ditutup otomatis jika panggilan ini gagal.
})

export default function RootLayout(): React.ReactElement | null {
  const colors = useThemeColors()
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  })
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true
    getOnboardingDone().then((done) => {
      if (mounted) {
        setOnboardingDone(done)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  if (!fontsLoaded || onboardingDone === null) {
    return null
  }

  if (!onboardingDone) {
    // Render inline (bukan route awal): Stack dengan initialRouteName yang
    // dinamis ternyata merender layar kosong di navigator ini.
    return (
      <SafeAreaProvider>
        <OnboardingScreen onDone={() => setOnboardingDone(true)} />
      </SafeAreaProvider>
    )
  }

  return (
    <SafeAreaProvider>
      <BackupProvider>
        <SettingsProvider>
          <TransactionsProvider>
            <BudgetsProvider>
              <RecurringProvider>
                <Stack screenOptions={{ animation: "fade" as const, contentStyle: { backgroundColor: colors.canvas }, headerShown: false }}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="add-transaction" options={{ animation: "slide_from_bottom" as const, presentation: "modal" }} />
                  <Stack.Screen name="budget-form" options={{ animation: "slide_from_bottom" as const, presentation: "modal" }} />
                  <Stack.Screen name="budgets" options={{ animation: "slide_from_bottom" as const, presentation: "modal" }} />
                  <Stack.Screen name="data" options={{ animation: "slide_from_right" as const }} />
                  <Stack.Screen name="onboarding" options={{ animation: "fade" as const }} />
                  <Stack.Screen name="recurring" options={{ animation: "slide_from_bottom" as const, presentation: "modal" }} />
                  <Stack.Screen name="recurring-form" options={{ animation: "slide_from_bottom" as const, presentation: "modal" }} />
                  <Stack.Screen name="settings" options={{ animation: "slide_from_bottom" as const, presentation: "modal" }} />
                  <Stack.Screen name="transaction/[id]" />
                  <Stack.Screen name="showcase" />
                </Stack>
              </RecurringProvider>
            </BudgetsProvider>
          </TransactionsProvider>
        </SettingsProvider>
      </BackupProvider>
    </SafeAreaProvider>
  )
}
