$dir = "$env:LOCALAPPDATA\omp"
$p = [Environment]::GetEnvironmentVariable('Path', 'User')
if ($null -eq $p) { $p = '' }
$already = ($p -split ';') | Where-Object { $_ -ieq $dir -or $_ -ieq '%LOCALAPPDATA%\omp' }
if ($already) {
	Write-Output "user PATH already contains $dir"
} else {
	[Environment]::SetEnvironmentVariable('Path', ($p.TrimEnd(';') + ';' + $dir), 'User')
	Write-Output "user PATH updated: appended $dir"
}
