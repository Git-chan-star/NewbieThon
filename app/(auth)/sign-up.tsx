import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from '@/components/layout/KeyboardAwareScrollView';
import { Button, TextField } from '@/components/ui';
import { useSignUp } from '@/features/auth/hooks/useAuth';
import { colors, spacing, typography } from '@/theme';
import { z } from 'zod';

const schema = z.object({
  displayName: z.string().min(2, '이름은 2자 이상 입력해 주세요.'),
  email: z.string().email('올바른 이메일 형식이 아니에요.'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 해요.'),
});

type FormValues = z.infer<typeof schema>;

export default function SignUpScreen() {
  const signUp = useSignUp();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: '', email: '', password: '' },
  });

  const onSubmit = (values: FormValues) => {
    signUp.mutate(values, {
      onSuccess: () => router.replace('/'),
    });
  };

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>회원가입</Text>
      <Text style={styles.subtitle}>이메일과 비밀번호로 간단하게 시작해요.</Text>

      <View style={styles.form}>
        <Controller
          control={control}
          name="displayName"
          render={({ field }) => (
            <TextField
              label="이름"
              placeholder="홍길동"
              required
              autoCapitalize="none"
              value={field.value}
              onChangeText={field.onChange}
              errorMessage={errors.displayName?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <TextField
              label="이메일"
              placeholder="student@example.com"
              required
              autoCapitalize="none"
              keyboardType="email-address"
              value={field.value}
              onChangeText={field.onChange}
              errorMessage={errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <TextField
              label="비밀번호"
              placeholder="8자 이상"
              required
              secureTextEntry
              value={field.value}
              onChangeText={field.onChange}
              errorMessage={errors.password?.message}
            />
          )}
        />
      </View>

      {signUp.isError ? (
        <Text style={styles.serverError} accessibilityLiveRegion="polite">
          {(signUp.error as Error).message}
        </Text>
      ) : null}

      <Button label="다음" onPress={handleSubmit(onSubmit)} loading={signUp.isPending} />
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, gap: spacing.lg, backgroundColor: colors.bg, flexGrow: 1 },
  title: { ...typography.title1, color: colors.textPrimary },
  subtitle: { ...typography.body2, color: colors.textSecondary },
  form: { gap: spacing.md },
  serverError: { ...typography.body2, color: colors.danger },
});
