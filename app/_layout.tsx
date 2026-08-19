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

import { AuthGate } from "../src/components/auth/AuthGate"
import { AuthProvider, useAuth } from "../src/features/auth/AuthProvider"
import { BackupProvider } from "../src/features/backup/BackupProvider"
import { BudgetsProvider } from "../src/features/budgets/BudgetsProvider"
import { RecurringProvider } from "../src/features/recurring/RecurringProvider"
import { SettingsProvider } from "../src/features/settings/SettingsProvider"
import { TransactionsProvider } from "../src/features/transactions/TransactionsProvider"
import { getOnboardingDone } from "../src/storage/onboarding"
import { ThemePreferenceProvider, useThemeColors } from "../src/theme"

SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash tetap bisa ditutup otomatis jika panggilan ini gagal.
})

export default function RootLayout(): React.ReactElement | null {
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

  return (
    <AuthProvider>
      <RootContent
        fontsLoaded={fontsLoaded}
        onboardingDone={onboardingDone}
        onOnboardingDone={() => setOnboardingDone(true)}
      />
    </AuthProvider>
  )
}

type RootContentProps = {
  readonly fontsLoaded: boolean
  readonly onboardingDone: boolean | null
  readonly onOnboardingDone: () => void
}

function RootContent({ fontsLoaded, onboardingDone, onOnboardingDone }: RootContentProps): React.ReactElement | null {
  const colors = useThemeColors()
  const { state: authState } = useAuth()

  if (!fontsLoaded || onboardingDone === null) {
    return null
  }

  if (!onboardingDone) {
    // Render inline (bukan route awal): Stack dengan initialRouteName yang
    // dinamis ternyata merender layar kosong di navigator ini.
    return (
      <SafeAreaProvider>
        <ThemePreferenceProvider preference="light">
          <OnboardingScreen onDone={onOnboardingDone} />
        </ThemePreferenceProvider>
      </SafeAreaProvider>
    )
  }

  if (authState !== "authenticated") {
    // Gerbang auth inline (bukan route — deep link /login & /register
    // sengaja tidak ada). Provider data di bawah TIDAK dipasang selama sesi
    // belum terverifikasi, jadi tidak ada layar yang bisa diakses tanpa login.
    // Tema di-pin ke terang: layar pra-login berpola desain terang, tidak
    // bergantung pada preferensi tersimpan milik pengguna yang belum masuk.
    return (
      <SafeAreaProvider>
        <ThemePreferenceProvider preference="light">
          <AuthGate />
        </ThemePreferenceProvider>
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
                  <Stack.Screen name="edit-profile" options={{ animation: "slide_from_right" as const }} />
                  <Stack.Screen name="onboarding" options={{ animation: "fade" as const }} />
                  <Stack.Screen name="recurring" options={{ animation: "slide_from_bottom" as const, presentation: "modal" }} />
                  <Stack.Screen name="recurring-form" options={{ animation: "slide_from_bottom" as const, presentation: "modal" }} />
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
