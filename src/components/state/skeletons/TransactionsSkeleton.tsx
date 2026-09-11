import { StyleSheet, View } from "react-native"

import { spacing } from "../../../theme"
import { Skeleton } from "../Skeleton"

export function TransactionsSkeleton(): React.ReactElement {
  return (
    <View style={styles.container}>
      <Skeleton height={52} />
      <View style={styles.chips}>
        <View style={styles.chip}>
          <Skeleton height={44} />
        </View>
        <View style={styles.chip}>
          <Skeleton height={44} />
        </View>
        <View style={styles.chip}>
          <Skeleton height={44} />
        </View>
      </View>
      <View style={styles.summary}>
        <View style={styles.card}>
          <Skeleton height={80} />
        </View>
        <View style={styles.card}>
          <Skeleton height={80} />
        </View>
      </View>
      <View style={styles.rows}>
        <Skeleton height={68} />
        <Skeleton height={68} />
        <Skeleton height={68} />
        <Skeleton height={68} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  chip: {
    flex: 1,
  },
  chips: {
    flexDirection: "row",
    gap: spacing.compact,
  },
  container: {
    gap: spacing.section,
  },
  rows: {
    gap: spacing.row,
  },
  summary: {
    flexDirection: "row",
    gap: spacing.row,
  },
})
