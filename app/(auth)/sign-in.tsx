import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from '@/components/layout/KeyboardAwareScrollView';
import { Button, TextField } from '@/components/ui';
import { useSignIn } from '@/features/auth/hooks/useAuth';
import { colors, spacing, typography } from '@/theme';
import { z } from 'zod';

const schema = z.object({
  loginId: z.string().trim().min(1, '이메일 또는 관리자 아이디를 입력해 주세요.').refine(
    (value) => value.toLowerCase() === 'admin' || z.string().email().safeParse(value).success,
    '올바른 이메일 또는 관리자 아이디를 입력해 주세요.'
  ),
  password: z.string().min(1, '비밀번호를 입력해 주세요.'),
});

type FormValues = z.infer<typeof schema>;

export default function SignInScreen() {
  const signIn = useSignIn();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { loginId: '', password: '' },
  });

  const onSubmit = (values: FormValues) => {
    const email = values.loginId.toLowerCase() === 'admin'
      ? process.env.EXPO_PUBLIC_ADMIN_EMAIL ?? 'admin@itgu.local'
      : values.loginId;
    signIn.mutate({ email, password: values.password }, {
      onSuccess: () => router.replace('/'),
    });
  };

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>로그인</Text>
      <Text style={styles.subtitle}>가입할 때 사용한 이메일로 로그인해요.</Text>

      <View style={styles.form}>
        <Controller
          control={control}
          name="loginId"
          render={({ field }) => (
            <TextField
              label="이메일 또는 관리자 아이디"
              placeholder="student@example.com 또는 admin"
              required
              autoCapitalize="none"
              keyboardType="email-address"
              value={field.value}
              onChangeText={field.onChange}
              errorMessage={errors.loginId?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <TextField
              label="비밀번호"
              placeholder="비밀번호"
              required
              secureTextEntry
              value={field.value}
              onChangeText={field.onChange}
              errorMessage={errors.password?.message}
            />
          )}
        />
      </View>

      {signIn.isError ? (
        <Text style={styles.serverError} accessibilityLiveRegion="polite">
          {(signIn.error as Error).message}
        </Text>
      ) : null}

      <Button label="로그인" onPress={handleSubmit(onSubmit)} loading={signIn.isPending} />
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
