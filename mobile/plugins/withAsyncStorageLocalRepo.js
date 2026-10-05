const { withProjectBuildGradle } = require("@expo/config-plugins");

// @react-native-async-storage/async-storage (v3.x) ships its native
// "shared storage" AAR only inside its own bundled local_repo/ directory —
// org.asyncstorage.shared_storage:storage-android:1.0.0 is not published to
// Maven Central or Google's repo. The package's own build.gradle never
// declares this repo itself (a known gap: see
// react-native-async-storage/async-storage#1280 / PR #1279, unreleased as of
// 3.1.1), so the consuming app must add it, or every release/preview build
// fails with "Could not find org.asyncstorage.shared_storage:storage-android:1.0.0".
module.exports = function withAsyncStorageLocalRepo(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === "groovy") {
      const marker = "async-storage/android/local_repo";
      if (!config.modResults.contents.includes(marker)) {
        const repoLine =
          "    maven { url(\"$rootDir/../node_modules/@react-native-async-storage/async-storage/android/local_repo\") }";
        config.modResults.contents = config.modResults.contents.replace(
          /allprojects\s*\{\s*repositories\s*\{/,
          (match) => `${match}\n${repoLine}`,
        );
      }
    }
    return config;
  });
};
