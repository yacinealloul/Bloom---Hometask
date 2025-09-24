FROM e2bdev/code-interpreter:latest
RUN npm install -g expo-cli
WORKDIR /home/user

# Create project
RUN npx create-expo-app@latest app --yes

# Clean up tabs structure
WORKDIR /home/user/app
RUN rm -rf "(tabs)" modal.tsx

# Create simple _layout.tsx
RUN printf 'import { Stack } from "expo-router";\n\nexport default function RootLayout() {\n  return (\n    <Stack screenOptions={{ headerShown: false }} />\n  );\n}\n' > app/_layout.tsx

# Create simple index.tsx
RUN printf 'import { View, Text, StyleSheet } from "react-native";\n\nexport default function HomeScreen() {\n  return (\n    <View style={styles.container}>\n      <Text style={styles.title}>Welcome</Text>\n      <Text style={styles.subtitle}>Ready to build something amazing!</Text>\n    </View>\n  );\n}\n\nconst styles = StyleSheet.create({\n  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },\n  title: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },\n  subtitle: { fontSize: 16, color: "#666", textAlign: "center" },\n});\n' > app/index.tsx
