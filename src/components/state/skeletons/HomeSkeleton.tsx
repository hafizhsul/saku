import { StyleSheet, View } from "react-native"

import { spacing } from "../../../theme"
import { Skeleton } from "../Skeleton"

export function HomeSkeleton(): React.ReactElement {
  return (
    <View style={styles.container}>
      <Skeleton height={150} />
      <View style={styles.grid}>
        <View style={styles.cell}>
          <Skeleton height={80} />
        </View>
        <View style={styles.cell}>
          <Skeleton height={80} />
        </View>
        <View style={styles.cell}>
          <Skeleton height={80} />
        </View>
        <View style={styles.cell}>
          <Skeleton height={80} />
        </View>
      </View>
      <Skeleton height={64} />
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
  cell: {
    flexBasis: "47%",
    flexGrow: 1,
  },
  container: {
    gap: spacing.section,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.row,
  },
  rows: {
    gap: spacing.row,
  },
})
