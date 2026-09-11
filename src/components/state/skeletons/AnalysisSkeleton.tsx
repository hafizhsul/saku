import { StyleSheet, View } from "react-native"

import { spacing } from "../../../theme"
import { Skeleton } from "../Skeleton"

export function AnalysisSkeleton(): React.ReactElement {
  return (
    <View style={styles.container}>
      <Skeleton height={170} />
      <View style={styles.bars}>
        <View style={styles.bar}>
          <Skeleton height={96} />
        </View>
        <View style={styles.bar}>
          <Skeleton height={64} />
        </View>
        <View style={styles.bar}>
          <Skeleton height={80} />
        </View>
        <View style={styles.bar}>
          <Skeleton height={48} />
        </View>
        <View style={styles.bar}>
          <Skeleton height={72} />
        </View>
        <View style={styles.bar}>
          <Skeleton height={56} />
        </View>
        <View style={styles.bar}>
          <Skeleton height={88} />
        </View>
      </View>
      <View style={styles.rows}>
        <Skeleton height={56} />
        <Skeleton height={56} />
        <Skeleton height={56} />
      </View>
      <Skeleton height={96} />
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flex: 1,
  },
  bars: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: spacing.compact,
  },
  container: {
    gap: spacing.section,
  },
  rows: {
    gap: spacing.row,
  },
})
