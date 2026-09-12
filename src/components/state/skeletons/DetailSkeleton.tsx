import { StyleSheet, View } from "react-native"

import { spacing } from "../../../theme"
import { Skeleton } from "../Skeleton"

export function DetailSkeleton(): React.ReactElement {
  return (
    <View style={styles.container}>
      <Skeleton height={140} />
      <Skeleton height={96} />
      <Skeleton height={96} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.section,
  },
})
